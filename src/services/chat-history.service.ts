import { Redis } from 'ioredis';
import { parsePositiveInteger } from '../utils/numbers.util.js';
import { ADD_HISTORY_COMMAND_NAME } from '../types/redis/redis.types.js';
import { HistoryChatMessage } from '../types/history/chat-history.types.js';
import { singleton } from 'tsyringe';
import { Logger } from './logger.service.js';

@singleton()
export class ChatHistoryService {
    private maxCount: number;
    private ttlInMinutes: number;
    private redisClient!: Redis;

    constructor(private readonly logger: Logger) {
        const { success: parsedMaxCount, value: maxCount } = parsePositiveInteger(process.env.HISTORY_MAX_COUNT || '0');
        const { success: parsedTtl, value: ttlInMinutes } = parsePositiveInteger(process.env.HISTORY_TTL_IN_MINUTES || '0');
        if (parsedMaxCount && parsedTtl) {
            this.maxCount = maxCount!;
            this.ttlInMinutes = ttlInMinutes!;
            this.redisClient = new Redis({
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
                username: process.env.REDIS_USERNAME,
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || '0'),
            });
            this.redisClient.defineCommand(ADD_HISTORY_COMMAND_NAME, {
                numberOfKeys: 1,
                lua: `
                    local key = KEYS[1]
                    local maxCount = tonumber(ARGV[1])
                    local ttlInMinutes = tonumber(ARGV[2])
                    local message = ARGV[3]
                    redis.call('lpush', key, message)
                    redis.call('ltrim', key, 0, maxCount - 1)
                    redis.call('expire', key, ttlInMinutes * 60)
                    redis.call('lrange', key, 0, maxCount - 1)
                `
            });
        }
        else {
            this.maxCount = 0;
            this.ttlInMinutes = 0;
        }
    }

    async add(sender: string, message: HistoryChatMessage): Promise<void> {
        if (this.redisClient) {
            try {
                await this.redisClient.updateChatHistory(this.buildCacheKey(sender), this.maxCount, this.ttlInMinutes, JSON.stringify(message));
            }
            catch (error) {
                this.logger.info("Error adding chat history", { error, sender, message });
            }
        }
    }

    async get(sender: string): Promise<HistoryChatMessage[]> {
        if (this.redisClient) {
            try {
                const history = await this.redisClient.lrange(this.buildCacheKey(sender), 0, this.maxCount - 1);
                return history.map(message => JSON.parse(message)).reverse();
            }
            catch (error) {
                this.logger.info("Error getting chat history", { error, sender });
            }
        }
        return [];
    }

    private buildCacheKey(sender: string) {
        return `chat-history:${sender}`;
    }
}