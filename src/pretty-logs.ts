import { LOG_LEVEL, COLORS } from "./constants";
import { Metadata, PrettyLogsWithOk, Colors } from "./types/log-types";

export class PrettyLogs {
  constructor() {
    this.ok = this.ok.bind(this);
    this.info = this.info.bind(this);
    this.error = this.error.bind(this);
    this.fatal = this.fatal.bind(this);
    this.debug = this.debug.bind(this);
    this.verbose = this.verbose.bind(this);
  }
  public fatal(message: string, metadata?: Metadata | string | unknown) {
    this._logWithStack(LOG_LEVEL.FATAL, message, metadata);
  }

  public error(message: string, metadata?: Metadata | string) {
    this._logWithStack(LOG_LEVEL.ERROR, message, metadata);
  }

  public ok(message: string, metadata?: Metadata | string) {
    this._logWithStack("ok", message, metadata);
  }

  public info(message: string, metadata?: Metadata | string) {
    this._logWithStack(LOG_LEVEL.INFO, message, metadata);
  }

  public debug(message: string, metadata?: Metadata | string) {
    this._logWithStack(LOG_LEVEL.DEBUG, message, metadata);
  }

  public verbose(message: string, metadata?: Metadata | string) {
    this._logWithStack(LOG_LEVEL.VERBOSE, message, metadata);
  }

  private _logWithStack(type: PrettyLogsWithOk, message: string, metaData?: Metadata | string | unknown) {
    this._log(type, message);
    if (typeof metaData === "string") {
      this._log(type, metaData);
      return;
    }
    if (metaData) {
      const metadata = metaData as Metadata;
      let stack = metadata?.error?.stack || metadata?.stack;
      if (!stack) {
        // generate and remove the top four lines of the stack trace
        const stackTrace = new Error().stack?.split("\n");
        if (stackTrace) {
          stackTrace.splice(0, 4);
          stack = stackTrace.filter((line) => line.includes(".ts:")).join("\n");
        }
      }
      const newMetadata = { ...metadata };
      delete newMetadata.message;
      delete newMetadata.name;
      delete newMetadata.stack;

      if (!this._isEmpty(newMetadata)) {
        this._log(type, newMetadata);
      }

      if (typeof stack == "string") {
        const prettyStack = this._formatStackTrace(stack, 1);
        const colorizedStack = this._colorizeText(prettyStack, COLORS.dim);
        this._log(type, colorizedStack);
      } else if (stack) {
        const prettyStack = this._formatStackTrace((stack as unknown as string[]).join("\n"), 1);
        const colorizedStack = this._colorizeText(prettyStack, COLORS.dim);
        this._log(type, colorizedStack);
      } else {
        throw new Error("Stack is null");
      }
    }
  }

  private _colorizeText(text: string, color: Colors): string {
    if (!color) {
      throw new Error(`Invalid color: ${color}`);
    }
    return color.concat(text).concat(COLORS.reset);
  }

  private _formatStackTrace(stack: string, linesToRemove = 0, prefix = ""): string {
    const lines = stack.split("\n");
    for (let i = 0; i < linesToRemove; i++) {
      lines.shift(); // Remove the top line
    }
    return lines
      .map((line) => `${prefix}${line.replace(/\s*at\s*/, "  ↳  ")}`) // Replace 'at' and prefix every line
      .join("\n");
  }

  private _isEmpty(obj: Record<string, unknown>) {
    return !Reflect.ownKeys(obj).some((key) => typeof obj[String(key)] !== "function");
  }

  private _log(type: PrettyLogsWithOk, message: string | Record<string, unknown>) {
    const defaultSymbols: Record<PrettyLogsWithOk, string> = {
      fatal: "×",
      ok: "✓",
      error: "⚠",
      info: "›",
      debug: "››",
      verbose: "💬",
    };

    const symbol = defaultSymbols[type];

    const messageFormatted = typeof message === "string" ? message : JSON.stringify(message, null, 2);

    // Constructing the full log string with the prefix symbol
    const lines = messageFormatted.split("\n");
    const logString = lines
      .map((line, index) => {
        // Add the symbol only to the first line and keep the indentation for the rest
        const prefix = index === 0 ? `\t${symbol}` : `\t${" ".repeat(symbol.length)}`;
        return `${prefix} ${line}`;
      })
      .join("\n");

    const fullLogString = logString;

    const colorMap: Record<PrettyLogsWithOk, [keyof typeof console, Colors]> = {
      fatal: ["error", COLORS.fgRed],
      ok: ["log", COLORS.fgGreen],
      error: ["warn", COLORS.fgYellow],
      info: ["info", COLORS.dim],
      debug: ["debug", COLORS.fgMagenta],
      verbose: ["debug", COLORS.dim],
    };

    const _console = console[colorMap[type][0] as keyof typeof console] as (...args: string[]) => void;
    if (typeof _console === "function" && fullLogString.length > 12) {
      _console(this._colorizeText(fullLogString, colorMap[type][1]));
    } else if (fullLogString.length <= 12) {
      // removing empty logs which only contain the symbol
      return;
    } else {
      throw new Error(fullLogString);
    }
  }
}
