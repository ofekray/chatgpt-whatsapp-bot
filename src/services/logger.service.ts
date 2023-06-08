import pino from "pino";
import { LogLevel } from "../types/pino-log-structure.type";

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
            additionalInfo,
        });
    }
}

export const logger = new Logger();

logger.info("Logger initialized");
logger.info("Ofek Test", { a: 1, z: ["aaa"] });