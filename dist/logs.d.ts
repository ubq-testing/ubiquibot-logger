import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "probot";
import { LogLevel, PrettyLogs } from "./pretty-logs.js";

declare class LogReturn {
  logMessage: LogMessage;
  metadata?: any;
  constructor(logMessage: LogMessage, metadata?: any);
}
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
type PublicMethods<T> = Exclude<FunctionPropertyNames<T>, "constructor" | keyof object>;
type LogMessage = {
  raw: string;
  diff: string;
  level: LogLevel;
  type: PublicMethods<Logs>;
};
declare class Logs {
  private _supabase;
  private _context;
  private _maxLevel;
  private _queue;
  private _concurrency;
  private _retryDelay;
  private _throttleCount;
  private _retryLimit;
  static console: PrettyLogs;
  private _log;
  private _addDiagnosticInformation;
  ok(log: string, metadata?: any, postComment?: boolean): LogReturn | null;
  info(log: string, metadata?: any, postComment?: boolean): LogReturn | null;
  error(log: string, metadata?: any, postComment?: boolean): LogReturn | null;
  debug(log: string, metadata?: any, postComment?: boolean): LogReturn | null;
  fatal(log: string, metadata?: any, postComment?: boolean): LogReturn | null;
  verbose(log: string, metadata?: any, postComment?: boolean): LogReturn | null;
  constructor(supabase: SupabaseClient, retryLimit: number, logLevel: LogLevel, context: Context | null);
  private _sendLogsToSupabase;
  private _processLogs;
  private _retryLog;
  private _processLogQueue;
  private _throttle;
  private _addToQueue;
  private _save;
  static _commentMetaData(metadata: any, level: LogLevel): string;
  private _diffColorCommentMessage;
  private _postComment;
  private _getNumericLevel;
  static convertErrorsIntoObjects(obj: any): any;
}

export { type LogMessage, LogReturn, Logs };
