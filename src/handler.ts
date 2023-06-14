import middy from "@middy/core";
import httpRouterHandler from "@middy/http-router";
import { routes } from "./routes.js";
import { FunctionURLHandler } from "./types/function-url-event.type.js";
import { SQSHandler } from "aws-lambda";
import { whatsappHandler } from "./handlers/whatsapp.handler.js";


export const webhookHandler: FunctionURLHandler = middy()
    .handler(httpRouterHandler(routes));
export const queueHandler: SQSHandler = whatsappHandler
    .handleQueueMessage.bind(whatsappHandler);