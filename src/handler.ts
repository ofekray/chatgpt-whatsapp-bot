import { Context } from "aws-lambda";
import { FunctionURLEvent, FunctionURLHandler } from "./types/function-url-event.type";
import { httpResult } from "./services/http-result.service";
import { logger } from "./services/logger.service";

export const whatsappWebhookHandler: FunctionURLHandler = async (event: FunctionURLEvent, context: Context) => {
    if (event.body) {
        const body = JSON.parse(event.body);
        logger.info("whatsappWebhookHandler", body);
        return httpResult(200, { message: "OK" });
    }
    else {
        return httpResult(400, { message: "No body provided" });
    }
};