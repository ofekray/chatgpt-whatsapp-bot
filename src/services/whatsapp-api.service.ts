
import got from 'got';
import { WhatsappMessageTypesEnum } from "../types/whatsapp-enums.type.js";
import { MessageRequestBody, TextMessageRequestBody } from "../types/whatsapp-messages.type.js";
import { logger } from "./logger.service.js";
import { WhatsappMediaURLResponse } from '../types/whatsapp-media.type.js';

class WhatsappApi {
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
            
            await this.postTextMessageRequest(body);
        }
        catch(error) {
            logger.error("Error sending whatsapp message", { error });
        }
    }

    async downloadMediaById(mediaId: string): Promise<Buffer | null> {
        try {
            const mediaURLResponse = await this.retrieveMediaURLRequest(mediaId);
            const buffer = await this.downloadMedia(mediaURLResponse.url);
            return buffer;
        }
        catch(error) {
            logger.error("Error downloading media", { error });
            return null;
        }
    }

    private async postTextMessageRequest<T extends MessageRequestBody<WhatsappMessageTypesEnum>>(body: T): Promise<void> {
        const url = `${process.env.WHATSAPP_API_BASE_URL}/${process.env.WHATSAPP_BUSINESS_NUMBER}/messages`;
        const headers = this.buildRequestHeaders();
        const response = await got.post(url, { headers, json: body }).json();
        logger.debug("Sucessfully sent message", { body, response });
    }

    private async retrieveMediaURLRequest(mediaId: string): Promise<WhatsappMediaURLResponse> {
        const url = `${process.env.WHATSAPP_API_BASE_URL}/${mediaId}`;
        const headers = this.buildRequestHeaders();
        const response = await got.get(url, { headers }).json<WhatsappMediaURLResponse>();
        logger.debug("Sucessfully retrieved media url", { mediaId, response });
        return response;
    }

    private async downloadMedia(url: string): Promise<Buffer> {
        const headers = this.buildRequestHeaders();
        const response = await got.get(url, { headers }).buffer();
        logger.debug("Sucessfully downloaded media", { url });
        return response;
    }

    private buildRequestHeaders<T extends MessageRequestBody<WhatsappMessageTypesEnum>>() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WHATSAPP_API_TOKEN}`
        }
    }
}

export const whatsappApi = new WhatsappApi();