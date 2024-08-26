export enum LogLevel {
    Info = "info",
    Warn = "warn",
    Error = "error",
    Debug = "debug",
    Trace = "trace"
}

export interface LogStructure {
    level: LogLevel;
    time: number;
    pid: number;
    hostname: string;
    message: string;
    additionalInfo?: object;
}