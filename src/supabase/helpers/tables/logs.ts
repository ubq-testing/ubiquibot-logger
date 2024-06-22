import { PrettyLogs } from "./pretty-logs";
import { Metadata, LogLevel, LogParams, LogReturn } from "../../types/log-types";
import { LOG_LEVEL } from "../../constants";

export class Logs {
  private _maxLevel = -1;
  static console: PrettyLogs;

  private _log({ level, consoleLog, logMessage, metadata, type }: LogParams): LogReturn | null {
    if (this._getNumericLevel(level) > this._maxLevel) return null; // filter out more verbose logs according to maxLevel set in config

    // needs to generate three versions of the information.
    // they must all first serialize the error object if it exists
    // - the comment to post on supabase (must be raw)
    // - the comment to post on github (must include diff syntax)
    // - the comment to post on the console (must be colorized)

    consoleLog(logMessage, metadata || undefined);
    return new LogReturn(
      {
        raw: logMessage,
        diff: this._diffColorCommentMessage(type, logMessage),
        type,
        level,
      },
      metadata
    );
  }

  private _addDiagnosticInformation(metadata: Record<string, unknown> | string | number | null | undefined) {
    // this is a utility function to get the name of the function that called the log
    // I have mixed feelings on this because it manipulates metadata later possibly without the developer understanding why and where,
    // but seems useful for the metadata parser to understand where the comment originated from

    if (!metadata) {
      metadata = {};
    }
    if (typeof metadata == "string" || typeof metadata == "number") {
      // TODO: think i need to support every data type
      metadata = { message: metadata };
    }

    const stackLines = new Error().stack?.split("\n") || [];
    if (stackLines.length > 3) {
      const callerLine = stackLines[3]; // .replace(process.cwd(), "");
      const match = callerLine.match(/at (\S+)/);
      if (match) {
        metadata.caller = match[1];
      }
    }

    return metadata;
  }

  public ok(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.INFO,
      consoleLog: Logs.console.ok,
      logMessage: log,
      metadata,
      postComment,
      type: "ok",
    });
  }

  public info(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.INFO,
      consoleLog: Logs.console.info,
      logMessage: log,
      metadata,
      postComment,
      type: "info",
    });
  }

  public error(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.ERROR,
      consoleLog: Logs.console.error,
      logMessage: log,
      metadata,
      postComment,
      type: "error",
    });
  }

  public debug(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.DEBUG,
      consoleLog: Logs.console.debug,
      logMessage: log,
      metadata,
      postComment,
      type: "debug",
    });
  }

  public fatal(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null {
    if (!metadata) {
      metadata = Logs.convertErrorsIntoObjects(new Error(log)) as Metadata;
      const stack = metadata.stack as string[];
      stack.splice(1, 1);
      metadata.stack = stack;
    }

    if (metadata instanceof Error) {
      metadata = Logs.convertErrorsIntoObjects(metadata) as Metadata;
      const stack = metadata.stack as string[];
      stack.splice(1, 1);
      metadata.stack = stack;
    }

    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.FATAL,
      consoleLog: Logs.console.fatal,
      logMessage: log,
      metadata,
      postComment,
      type: "fatal",
    });
  }

  public verbose(log: string, metadata?: Metadata, postComment?: boolean): LogReturn | null {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.VERBOSE,
      consoleLog: Logs.console.verbose,
      logMessage: log,
      metadata,
      postComment,
      type: "verbose",
    });
  }

  constructor(logLevel: LogLevel) {
    this._maxLevel = this._getNumericLevel(logLevel);
    Logs.console = new PrettyLogs();
  }

  static _commentMetaData(metadata: Metadata, level: LogLevel) {
    Logs.console.debug("the main place that metadata is being serialized as an html comment");
    const prettySerialized = JSON.stringify(metadata, null, 2);
    // first check if metadata is an error, then post it as a json comment
    // otherwise post it as an html comment
    if (level === LOG_LEVEL.FATAL) {
      return ["```json", prettySerialized, "```"].join("\n");
    } else {
      return ["<!--", prettySerialized, "-->"].join("\n");
    }
  }

  private _diffColorCommentMessage(type: string, message: string) {
    const diffPrefix = {
      fatal: "-", // - text in red
      ok: "+", // + text in green
      error: "!", // ! text in orange
      // info: "#", // # text in gray
      // debug: "@@@@",// @@ text in purple (and bold)@@
      // error: null,
      // warn: null,
      // info: null,
      // verbose: "#",
      // debug: "#",
    };
    const selected = diffPrefix[type as keyof typeof diffPrefix];

    if (selected) {
      message = message
        .trim() // Remove leading and trailing whitespace
        .split("\n")
        .map((line) => `${selected} ${line}`)
        .join("\n");
    } else if (type === "debug") {
      // debug has special formatting
      message = message
        .split("\n")
        .map((line) => `@@ ${line} @@`)
        .join("\n"); // debug: "@@@@",
    } else {
      // default to gray
      message = message
        .split("\n")
        .map((line) => `# ${line}`)
        .join("\n");
    }

    const diffHeader = "```diff";
    const diffFooter = "```";

    return [diffHeader, message, diffFooter].join("\n");
  }

  private _getNumericLevel(level: LogLevel) {
    switch (level) {
      case LOG_LEVEL.FATAL:
        return 0;
      case LOG_LEVEL.ERROR:
        return 1;
      case LOG_LEVEL.INFO:
        return 2;
      case LOG_LEVEL.VERBOSE:
        return 4;
      case LOG_LEVEL.DEBUG:
        return 5;
      default:
        return -1; // Invalid level
    }
  }
  static convertErrorsIntoObjects(obj: unknown): Metadata | unknown {
    // this is a utility function to render native errors in the console, the database, and on GitHub.
    if (obj instanceof Error) {
      return {
        message: obj.message,
        name: obj.name,
        stack: obj.stack ? obj.stack.split("\n") : null,
      };
    } else if (typeof obj === "object" && obj !== null) {
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        obj[key] = this.convertErrorsIntoObjects(obj[key]);
      });
    }
    return obj;
  }
}
