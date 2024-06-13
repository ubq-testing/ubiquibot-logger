import { COLORS, LOG_LEVEL } from "../constants";
import { Database } from "./database";

type LogFunction = (message: string, metadata?: Metadata) => void;
export type Colors = (typeof COLORS)[keyof typeof COLORS];
export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];
export type PrettyLogsWithOk = "ok" | LogLevel;
export type LogInsert = Database["public"]["Tables"]["logs"]["Insert"];
export type LogMessage = { raw: string; diff: string; level: LogLevel; type: PrettyLogsWithOk };

export type LogParams = {
    level: LogLevel;
    consoleLog: LogFunction;
    logMessage: string;
    metadata?: Metadata;
    postComment?: boolean;
    type: PrettyLogsWithOk;
};

export interface Metadata {
    error?: { stack?: string };
    stack?: string | string[] | null;
    message?: string;
    name?: string;
    [key: string]: unknown;
}

export class LogReturn {
    logMessage: LogMessage;
    metadata?: Metadata;

    constructor(logMessage: LogMessage, metadata?: Metadata) {
        this.logMessage = logMessage;
        this.metadata = metadata;
    }
}
