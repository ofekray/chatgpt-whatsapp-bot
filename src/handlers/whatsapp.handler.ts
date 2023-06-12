import { Context } from "aws-lambda";
import { FunctionURLEvent } from "../types/function-url-event.type.js";
import { httpResult } from "../services/http-result.service.js";
import { logger } from "../services/logger.service.js";
import { facebookPayloadValidator } from "../services/facebook-payload-validator.service.js";
import { WhatsappWebhookObject } from "../types/whatsapp-webhook.type.js";
import { whatsappApi } from "../services/whatsapp-api.service.js";
import { WhatsappWebhookTypesEnum } from "../types/whatsapp-enums.type.js";

class WhatsappHandler {
    constructor() {
    }

    async handleVerification(event: FunctionURLEvent, _context: Context) {
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

    async handleMessage(event: FunctionURLEvent, _context: Context) {
        const isValid = facebookPayloadValidator(event);
        if (!isValid) {
            return httpResult(401, { message: "Unauthorized" });
        }
        const whatsappWebhook: WhatsappWebhookObject = JSON.parse(event.body!);
        logger.debug("Webhook received", whatsappWebhook);
        const { messagesBySender, nameBySender } = this.groupMessages(whatsappWebhook);

        for (const [sender, messages] of messagesBySender) {
            const name = nameBySender.get(sender) ?? "Unknown";
            const text = `Hi ${name}, you said: ${messages.join(", ")}`;
            await whatsappApi.postTextMessage(sender, text);
        }
        return httpResult(200);
    }

    private groupMessages(whatsappWebhook: WhatsappWebhookObject) {
        const messagesBySender: Map<string, string[]> = new Map();
        const nameBySender: Map<string, string> = new Map();

        for (const entry of whatsappWebhook?.entry ?? []) {
            for (const change of entry?.changes ?? []) {
                for (const message of change?.value?.messages ?? []) {
                    if (message?.from && message?.type === WhatsappWebhookTypesEnum.Text && message?.text?.body) {
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
}

export const whatsappHandler = new WhatsappHandler();