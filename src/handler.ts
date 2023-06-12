import middy from "@middy/core";
import httpRouterHandler from "@middy/http-router";
import { routes } from "./routes.js";
import { FunctionURLHandler } from "./types/function-url-event.type.js";


export const webhookHandler: FunctionURLHandler = middy()
    .handler(httpRouterHandler(routes));
