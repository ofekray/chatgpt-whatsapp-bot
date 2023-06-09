import { FunctionURLResult } from "../types/function-url-event.type.js";

export const httpResult = <T>(statusCode: number, body: T): FunctionURLResult  => {
    return {
        statusCode,
        body: JSON.stringify(body)
    };
};