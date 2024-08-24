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
import { singleton } from "tsyringe";
import { ChatGPTAudioQuestion, ChatGPTImageQuestion, ChatGPTQuestion, ChatGPTQuestionType, ChatGTPTextQuestion } from "../types/chatgpt/chatgpt-question.type.js";

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
                const { questionsBySender, nameBySender } = await this.extractMessages(whatsappWebhook);
                this.logger.debug("Messages grouped", { messagesBySender: Array.from(questionsBySender.entries()) });
        
                for (const [sender, questions] of questionsBySender) {
                    const name = nameBySender.get(sender) ?? "Unknown";
                    const history = await this.chatHistoryService.get(sender);
                    const answer = await this.chatGPTApi.ask(name, questions, history);
                    // if (answer.type === ChatGPTResponseType.Image) {
                    //     await this.whatsappApi.postImageMessage(sender, answer.url);
                    // }
                    await this.whatsappApi.postTextMessage(sender, answer.content);
                    await this.chatHistoryService.add(sender, answer.newMessages);
                }
            }
        }
        catch (error) {
            this.logger.error("Error handling queue message", { error });
        }
    }

    private async extractMessages(whatsappWebhook: WhatsappWebhookObject) {
        const questionsBySender: Map<string, ChatGPTQuestion[]> = new Map();
        const nameBySender: Map<string, string> = new Map();

        for (const entry of whatsappWebhook?.entry ?? []) {
            for (const change of entry?.changes ?? []) {
                for (const message of change?.value?.messages ?? []) {
                    if (!message?.from || !this.isTimestampValid(message?.timestamp)) {
                        continue;
                    }

                    const question = await this.extractQuestion(message);
                    if (!question) {
                        continue;
                    }

                    if (!questionsBySender.has(message.from)) {
                        questionsBySender.set(message.from, []);
                    }
                    questionsBySender.get(message.from)!.push(question);

                    if (!nameBySender.has(message.from)) {
                        const name = change.value.contacts.find(x => x.wa_id === message.from)?.profile?.name;
                        if (name) {
                            nameBySender.set(message.from, name);
                        }
                    }
                }
            }
        }

        return { questionsBySender, nameBySender };
    }

    private async extractQuestion(message: WhatsappMessagesObject): Promise<ChatGPTQuestion | undefined> {
        try {
            if (message?.type === WhatsappWebhookTypesEnum.Text && message?.text?.body) {
                const result: ChatGTPTextQuestion = { type: ChatGPTQuestionType.Text, text: message?.text?.body };
                return result;
            }

            if (message?.type === WhatsappWebhookTypesEnum.Audio && message?.audio?.id) {
                const audio = await this.whatsappApi.downloadMediaById(message.audio.id);
                if (audio) {
                    const result: ChatGPTAudioQuestion = { type: ChatGPTQuestionType.Audio, audio, mimeType: message.audio.mime_type };
                    return result;
                }
            }

            if (message?.type === WhatsappWebhookTypesEnum.Image && message?.image?.id) {
                const image = await this.whatsappApi.downloadMediaById(message.image.id);
                if (image) {
                    const result: ChatGPTImageQuestion = { type: ChatGPTQuestionType.Image, image, mimeType: message.image.mime_type, text: message.image.caption };
                    return result;
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