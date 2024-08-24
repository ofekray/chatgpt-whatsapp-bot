
import ky from 'ky';
import { WhatsappMessageTypesEnum } from "../types/whatsapp/whatsapp-enums.type.js";
import { ImageMessageRequestBody, MessageRequestBody, TextMessageRequestBody } from "../types/whatsapp/whatsapp-messages.type.js";
import { WhatsappMediaURLResponse } from '../types/whatsapp/whatsapp-media.type.js';
import { Logger } from './logger.service.js';
import { singleton } from 'tsyringe';

@singleton()
export class WhatsappApi {
    constructor(private readonly logger: Logger) {}

    async postTextMessage(to: string, text: string) {
        try {
            const body: TextMessageRequestBody = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: WhatsappMessageTypesEnum.Text,
                text: {
                    preview_url: false,
                    body: text,
                }
            };
            
            await this.postMessageRequest(body);
        }
        catch(error) {
            this.logger.error("Error sending whatsapp text message", { error });
        }
    }

    async postImageMessage(to: string, imageUrl: string) {
        try {
            const body: ImageMessageRequestBody = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: WhatsappMessageTypesEnum.Image,
                image: {
                    link: imageUrl,
                }
            };

            await this.postMessageRequest(body);
        }
        catch(error) {
            this.logger.error("Error sending whatsapp image message", { error });
        }
    }

    async downloadMediaById(mediaId: string): Promise<ArrayBuffer | null> {
        try {
            const mediaURLResponse = await this.retrieveMediaURLRequest(mediaId);
            const buffer = await this.downloadMedia(mediaURLResponse.url);
            return buffer;
        }
        catch(error) {
            this.logger.error("Error downloading media", { error });
            return null;
        }
    }

    private async postMessageRequest<T extends MessageRequestBody<WhatsappMessageTypesEnum>>(body: T): Promise<void> {
        const url = `${process.env.WHATSAPP_API_BASE_URL}/${process.env.WHATSAPP_BUSINESS_NUMBER}/messages`;
        const headers = this.buildRequestHeaders();
        const response = await ky.post(url, { headers, json: body }).json();
        this.logger.debug("Sucessfully sent message", { body, response });
    }

    private async retrieveMediaURLRequest(mediaId: string): Promise<WhatsappMediaURLResponse> {
        const url = `${process.env.WHATSAPP_API_BASE_URL}/${mediaId}`;
        const headers = this.buildRequestHeaders();
        const response = await ky.get(url, { headers }).json<WhatsappMediaURLResponse>();
        this.logger.debug("Sucessfully retrieved media url", { mediaId, response });
        return response;
    }

    private async downloadMedia(url: string): Promise<ArrayBuffer> {
        const headers = this.buildRequestHeaders();
        const response = await ky.get(url, { headers }).arrayBuffer();
        this.logger.debug("Sucessfully downloaded media", { url });
        return response;
    }

    private buildRequestHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WHATSAPP_API_TOKEN}`
        }
    }
}