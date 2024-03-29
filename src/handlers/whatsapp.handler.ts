import { Context, SQSEvent } from "aws-lambda";
import { FunctionURLEvent } from "../types/lambda/function-url-event.type.js";
import { httpResult } from "../utils/http-result.util.js";
import { Logger } from "../services/logger.service.js";
import { FacebookPayloadValidator } from "../services/facebook-payload-validator.service.js";
import { WhatsappMessagesObject, WhatsappWebhookObject } from "../types/whatsapp/whatsapp-webhook.type.js";
import { WhatsappApi } from "../services/whatsapp-api.service.js";
import { WhatsappWebhookTypesEnum } from "../types/whatsapp/whatsapp-enums.type.js";
import { ChatGPTApi } from "../services/chatgpt-api.service.js";
import { MessageReceivedPublisher } from "../services/message-recevied-publisher.service.js";
import { ChatHistoryService } from "../services/chat-history.service.js";
import { ChatGPTResponseType } from "../types/chatgpt/chatgpt-response.type.js";
import { singleton } from "tsyringe";

@singleton()
export class WhatsappHandler {
    private readonly MESSAGE_TIME_LIMIT_IN_MINUTES = 2;
    constructor(
        private readonly logger: Logger,
        private readonly facebookPayloadValidator: FacebookPayloadValidator,
        private readonly chatHistoryService: ChatHistoryService,
        private readonly messageReceivedPublisher: MessageReceivedPublisher,
        private readonly chatGPTApi: ChatGPTApi,
        private readonly whatsappApi: WhatsappApi) {
    }

    async handleVerification(event: FunctionURLEvent, _context: Context) {
        try {
            const mode = event.queryStringParameters?.["hub.mode"];
            const token = event.queryStringParameters?.["hub.verify_token"];
            const challenge = event.queryStringParameters?.["hub.challenge"];
    
            if (mode !== "subscribe" || token !== process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || !challenge) {
                this.logger.info("Verification failed", event);
                return httpResult(401, { message: "Unauthorized" });
            }
    
            this.logger.info("Verification successful", event);
            return httpResult(200, challenge);
        }
        catch (error) {
            this.logger.error("Error handling verification", { error });
            return httpResult(500, { message: "Internal server error" });
        }
    }

    async handleWebhookMessage(event: FunctionURLEvent, _context: Context) {
        try {
            const isValid = this.facebookPayloadValidator.validate(event);
            if (!isValid) {
                return httpResult(401, { message: "Unauthorized" });
            }

            this.logger.debug("Webhook received", { body: event.body });
            await this.messageReceivedPublisher.publish(event.body!); // Publish to SQS, so whatsapp will receive a 200 response immediately

            return httpResult(200);
        }
        catch (error) {
            this.logger.error("Error handling message", { error });
            return httpResult(500, { message: "Internal server error" });
        }
    }

    async handleQueueMessage(event: SQSEvent, _context: Context) {
        try {
            for (const record of event.Records) {
                const whatsappWebhook: WhatsappWebhookObject = JSON.parse(record.body);
                this.logger.debug("Webhook received", whatsappWebhook);
                const { messagesBySender, nameBySender } = await this.extractMessages(whatsappWebhook);
                this.logger.debug("Messages grouped", { messagesBySender: Array.from(messagesBySender.entries()) });
        
                for (const [sender, messages] of messagesBySender) {
                    const name = nameBySender.get(sender) ?? "Unknown";
                    const question = messages.join("\n");
                    const history = await this.chatHistoryService.get(sender);
                    const answer = await this.chatGPTApi.ask(name, question, history);
                    if (answer.type === ChatGPTResponseType.Image) {
                        await this.whatsappApi.postImageMessage(sender, answer.url);
                    }
                    else {
                        await this.whatsappApi.postTextMessage(sender, answer.text);
                        await this.chatHistoryService.add(sender, { question, answer: answer.text, toolCalls: answer.toolCalls });
                    }
                }
            }
        }
        catch (error) {
            this.logger.error("Error handling queue message", { error });
        }
    }

    private async extractMessages(whatsappWebhook: WhatsappWebhookObject) {
        const messagesBySender: Map<string, string[]> = new Map();
        const nameBySender: Map<string, string> = new Map();

        for (const entry of whatsappWebhook?.entry ?? []) {
            for (const change of entry?.changes ?? []) {
                for (const message of change?.value?.messages ?? []) {
                    if (!message?.from || !this.isTimestampValid(message?.timestamp)) {
                        continue;
                    }

                    const messageText = await this.extractMessageText(message);
                    if (!messageText) {
                        continue;
                    }

                    if (!messagesBySender.has(message.from)) {
                        messagesBySender.set(message.from, []);
                    }
                    messagesBySender.get(message.from)!.push(messageText);

                    if (!nameBySender.has(message.from)) {
                        const name = change.value.contacts.find(x => x.wa_id === message.from)?.profile?.name;
                        if (name) {
                            nameBySender.set(message.from, name);
                        }
                    }
                }
            }
        }

        return { messagesBySender, nameBySender };
    }

    private async extractMessageText(message: WhatsappMessagesObject): Promise<string | undefined> {
        try {
            if (message?.type === WhatsappWebhookTypesEnum.Text) {
                return message?.text?.body;
            }

            if (message?.type === WhatsappWebhookTypesEnum.Audio && message?.audio?.id) {
                const audio = await this.whatsappApi.downloadMediaById(message.audio.id);
                if (audio) {
                    const transcription = await this.chatGPTApi.transcribe(audio);
                    return transcription;
                }
            }

            return undefined;
        }
        catch (error) {
            this.logger.error("Error extracting message text", { error });
            return undefined;
        }
    }

    private isTimestampValid(timestampString: string) {
        const timestamp = +timestampString;
        const differenceInMinutes = ((Date.now()/1000) - timestamp)/60;
        this.logger.debug("Timestamp difference in minutes", { differenceInMinutes });
        return differenceInMinutes < this.MESSAGE_TIME_LIMIT_IN_MINUTES;
    }
}