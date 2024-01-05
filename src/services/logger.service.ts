import { pino } from 'pino';
import { serializeError } from 'serialize-error';
import { LogLevel } from "../types/pino-log-structure.type.js";

export class Logger {
    private readonly logger: pino.Logger;
    constructor() {
        this.logger = pino({
            level: process.env.LOG_LEVEL || "info",
            formatters: {
                level: (label) => {
                    return { level: label };
                }
            }
        });
    }

    public info<T extends object>(message: string, additionInfo?: T): void {
        this.log(LogLevel.Info, message, additionInfo);
    }

    public debug<T extends object>(message: string, additionInfo?: T): void {
        this.log(LogLevel.Debug, message, additionInfo);
    }

    public warn<T extends object>(message: string, additionInfo?: T): void {
        this.log(LogLevel.Warn, message, additionInfo);
    }

    public error<T extends object>(message: string, additionInfo?: T): void {
        this.log(LogLevel.Error, message, additionInfo);
    }

    private log<T extends object>(level: LogLevel, message: string, additionalInfo?: T): void {
        this.logger[level]({
            message,
            additionalInfo: additionalInfo ? this.serializeAdditionalInfo(additionalInfo) : undefined,
        });
    }

    private serializeAdditionalInfo<T extends object>(info: object): T {
        let result: any = {};

        for (const [key, value] of Object.entries(info)) {
            if (value instanceof Error) {
                result[key] = serializeError(value);
            }
            else {
                result[key] = value;
            }
        }

        return result;
    }
}