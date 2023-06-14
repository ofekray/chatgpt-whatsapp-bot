import { Context } from "aws-lambda";
import { whatsappHandler } from "./handlers/whatsapp.handler.js";
import { httpResult } from "./services/http-result.service.js";
import { FunctionURLEvent, FunctionURLRoute } from "./types/function-url-event.type.js";

export const routes: FunctionURLRoute[] = [
    {
        method: "GET",
        path: "/whatsapp",
        handler: whatsappHandler.handleVerification.bind(whatsappHandler)
    },
    {
        method: "POST",
        path: "/whatsapp",
        handler: whatsappHandler.handleWebhookMessage.bind(whatsappHandler)
    },
    {
        method: "ANY",
        path: "/{proxy+}",
        handler: async (_event: FunctionURLEvent, _context: Context) => httpResult(404, { message: "Not Found" })
    }
];