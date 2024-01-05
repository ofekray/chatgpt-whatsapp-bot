import { container } from "tsyringe";
import { Context } from "aws-lambda";
import { httpResult } from "./utils/http-result.util.js";
import { FunctionURLEvent, FunctionURLRoute } from "./types/function-url-event.type.js";
import { WhatsappHandler } from "./handlers/whatsapp.handler.js";

const whatsappHandler = container.resolve(WhatsappHandler);

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