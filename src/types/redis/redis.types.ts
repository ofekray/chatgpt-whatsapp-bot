import { Result } from "ioredis";

declare module "ioredis" {
    interface RedisCommander<Context> {
        updateChatHistory(
            key: string,
            maxCount: number,
            ttlInMinutes: number,
            message: string
        ): Result<string[], Context>;
    }
}

export const ADD_HISTORY_COMMAND_NAME = 'updateChatHistory';
