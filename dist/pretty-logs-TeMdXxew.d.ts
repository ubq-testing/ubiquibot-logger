declare const LOG_LEVEL: {
  readonly FATAL: "fatal";
  readonly ERROR: "error";
  readonly INFO: "info";
  readonly VERBOSE: "verbose";
  readonly DEBUG: "debug";
};

type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];
type PrettyLogsWithOk = "ok" | LogLevel;
type LogMessage = {
  raw: string;
  diff: string;
  level: LogLevel;
  type: PrettyLogsWithOk;
};
interface Metadata {
  error?: {
    stack?: string;
  };
  stack?: string | string[] | null;
  message?: string;
  name?: string;
  [key: string]: unknown;
}
declare class LogReturn {
  logMessage: LogMessage;
  metadata?: Metadata;
  constructor(logMessage: LogMessage, metadata?: Metadata);
}

declare class PrettyLogs {
  constructor();
  fatal(message: string, metadata?: Metadata | string | unknown): void;
  error(message: string, metadata?: Metadata | string): void;
  ok(message: string, metadata?: Metadata | string): void;
  info(message: string, metadata?: Metadata | string): void;
  debug(message: string, metadata?: Metadata | string): void;
  verbose(message: string, metadata?: Metadata | string): void;
  private _logWithStack;
  private _colorizeText;
  private _formatStackTrace;
  private _isEmpty;
  private _log;
}

export { LogReturn as L, type Metadata as M, PrettyLogs as P, type LogLevel as a };
