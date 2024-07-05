import { COLORS, LOG_LEVEL } from "../constants";

type LogMessage = { raw: string; diff: string; level: LogLevel; type: LogLevelWithOk };
type LogFunction = (message: string, metadata?: Metadata) => void;

export type Colors = (typeof COLORS)[keyof typeof COLORS];
export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];
export type LogLevelWithOk = "ok" | LogLevel;

export type LogParams = {
  consoleLog: LogFunction;
  logMessage: string;
  level: LogLevel;
  type: LogLevelWithOk;
  metadata?: Metadata;
};

interface MetadataInterface {
  error: Error | { stack: string };
  stack: string | string[] | null;
  message: string;
  name: string;
  [key: string]: unknown;
}

export type Metadata = Partial<MetadataInterface>;

export class LogReturn {
  logMessage: LogMessage;
  metadata?: Metadata;

  constructor(logMessage: LogMessage, metadata?: Metadata) {
    this.logMessage = logMessage;
    this.metadata = metadata;
  }
}
