import "reflect-metadata";
import { container } from "tsyringe";
import { SQSHandler } from "aws-lambda";
import middy from "@middy/core";
import httpRouterHandler from "@middy/http-router";
import { routes } from "./routes.js";
import { FunctionURLHandler } from "./types/function-url-event.type.js";
import { WhatsappHandler } from "./handlers/whatsapp.handler.js";


const whatsappHandler = container.resolve(WhatsappHandler);

export const webhookHandler: FunctionURLHandler = middy()
    .handler(httpRouterHandler(routes));
export const queueHandler: SQSHandler = whatsappHandler
    .handleQueueMessage.bind(whatsappHandler);