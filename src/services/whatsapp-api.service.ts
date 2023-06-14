
import got from 'got';
import { WhatsappMessageTypesEnum } from "../types/whatsapp-enums.type.js";
import { MessageRequestBody, TextMessageRequestBody } from "../types/whatsapp-messages.type.js";
import { logger } from "./logger.service.js";

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
    
            
            await this.sendRequest(body);
        }
        catch(error) {
            logger.error("Error sending whatsapp message", { error });
        }
    }

    private async sendRequest<T extends MessageRequestBody<WhatsappMessageTypesEnum>>(body: T) {
        const url = this.buildUrl();
        const headers = this.buildRequestHeaders(body);
        try {
            const response = await got.post(url, { headers, json: body }).json();
            logger.debug("Sucessfully sent message", { body, response });
        }
        catch (error) {
            logger.error("Error sending message", { body, response: (error as any).response, error: error });
        }
    }
    

    private buildRequestHeaders<T extends MessageRequestBody<WhatsappMessageTypesEnum>>(body: T) {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.WHATSAPP_API_TOKEN}`
        }
    }

    private buildUrl() {
        return `${process.env.WHATSAPP_API_BASE_URL}/${process.env.WHATSAPP_BUSINESS_NUMBER}/messages`
    }
}

export const whatsappApi = new WhatsappApi();