import { P as PrettyLogs, M as Metadata, L as LogReturn, a as LogLevel } from './pretty-logs-TeMdXxew.js';

declare class Logs {
    private _maxLevel;
    static console: PrettyLogs;
    private _log;
    private _addDiagnosticInformation;
    ok(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null;
    info(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null;
    error(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null;
    debug(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null;
    fatal(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null;
    verbose(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null;
    constructor(logLevel: LogLevel);
    static _commentMetaData(metadata: Metadata, level: LogLevel): string;
    private _diffColorCommentMessage;
    private _getNumericLevel;
    static convertErrorsIntoObjects(obj: unknown): Metadata | unknown;
}

export { Logs };
