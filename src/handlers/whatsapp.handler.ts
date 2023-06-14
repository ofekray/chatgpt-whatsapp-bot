import { Context, SQSEvent } from "aws-lambda";
import { FunctionURLEvent } from "../types/function-url-event.type.js";
import { httpResult } from "../services/http-result.service.js";
import { logger } from "../services/logger.service.js";
import { facebookPayloadValidator } from "../services/facebook-payload-validator.service.js";
import { WhatsappWebhookObject } from "../types/whatsapp-webhook.type.js";
import { whatsappApi } from "../services/whatsapp-api.service.js";
import { WhatsappWebhookTypesEnum } from "../types/whatsapp-enums.type.js";
import { chatGPTApi } from "../services/chatgpt-api.service.js";
import { messageReceivedPublisher } from "../services/message-recevied-publisher.service.js";

class WhatsappHandler {
    private readonly MESSAGE_TIME_LIMIT_IN_MINUTES = 2;
    constructor() {
    }

    async handleVerification(event: FunctionURLEvent, _context: Context) {
        try {
            const mode = event.queryStringParameters?.["hub.mode"];
            const token = event.queryStringParameters?.["hub.verify_token"];
            const challenge = event.queryStringParameters?.["hub.challenge"];
    
            if (mode !== "subscribe" || token !== process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || !challenge) {
                logger.info("Verification failed", event);
                return httpResult(401, { message: "Unauthorized" });
            }
    
            logger.info("Verification successful", event);
            return httpResult(200, challenge);
        }
        catch (error) {
            logger.error("Error handling verification", { error });
            return httpResult(500, { message: "Internal server error" });
        }
    }

    async handleWebhookMessage(event: FunctionURLEvent, _context: Context) {
        try {
            const isValid = facebookPayloadValidator(event);
            if (!isValid) {
                return httpResult(401, { message: "Unauthorized" });
            }

            logger.debug("Webhook received", { body: event.body });
            await messageReceivedPublisher.publish(event.body!); // Publish to SQS, so whatsapp will receive a 200 response immediately

            return httpResult(200);
        }
        catch (error) {
            logger.error("Error handling message", { error });
            return httpResult(500, { message: "Internal server error" });
        }
    }

    async handleQueueMessage(event: SQSEvent, _context: Context) {
        try {
            for (const record of event.Records) {
                const whatsappWebhook: WhatsappWebhookObject = JSON.parse(record.body);
                logger.debug("Webhook received", whatsappWebhook);
                const { messagesBySender, nameBySender } = this.groupMessages(whatsappWebhook);
                logger.debug("Messages grouped", { messagesBySender: Array.from(messagesBySender.entries()) });
        
                for (const [sender, messages] of messagesBySender) {
                    const name = nameBySender.get(sender) ?? "Unknown"; // Can by used to personalize the answer in the future
                    const question = messages.join("\n");
                    const answer = await chatGPTApi.ask(question);
                    await whatsappApi.postTextMessage(sender, answer);
                }
            }
        }
        catch (error) {
            logger.error("Error handling queue message", { error });
        }
    }

    private groupMessages(whatsappWebhook: WhatsappWebhookObject) {
        const messagesBySender: Map<string, string[]> = new Map();
        const nameBySender: Map<string, string> = new Map();

        for (const entry of whatsappWebhook?.entry ?? []) {
            for (const change of entry?.changes ?? []) {
                for (const message of change?.value?.messages ?? []) {
                    if (message?.from && message?.type === WhatsappWebhookTypesEnum.Text && message?.text?.body && this.isTimestampValid(message?.timestamp)) {
                        if (!messagesBySender.has(message.from)) {
                            messagesBySender.set(message.from, []);
                        }
                        messagesBySender.get(message.from)!.push(message.text.body);

                        if (!nameBySender.has(message.from)) {
                            const name = change.value.contacts.find(x => x.wa_id === message.from)?.profile?.name;
                            if (name) {
                                nameBySender.set(message.from, name);
                            }
                        }
                    }
                }
            }
        }

        return { messagesBySender, nameBySender };
    }

    private isTimestampValid(timestampString: string) {
        const timestamp = +timestampString;
        const differenceInMinutes = ((Date.now()/1000) - timestamp)/60;
        logger.debug("Timestamp difference in minutes", { differenceInMinutes });
        return differenceInMinutes < this.MESSAGE_TIME_LIMIT_IN_MINUTES;
    }
}

export const whatsappHandler = new WhatsappHandler();