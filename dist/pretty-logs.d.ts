declare class PrettyLogs {
  constructor();
  fatal(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  ok(message: string, metadata?: any): void;
  info(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
  verbose(message: string, metadata?: any): void;
  private _logWithStack;
  private _colorizeText;
  private _formatStackTrace;
  private _isEmpty;
  private _log;
}
declare enum LogLevel {
  FATAL = "fatal",
  ERROR = "error",
  INFO = "info",
  VERBOSE = "verbose",
  DEBUG = "debug",
}

export { LogLevel, PrettyLogs };
