// src/supabase/helpers/pretty-logs.ts
import util from "util";
var PrettyLogs = class {
  constructor() {
    this.ok = this.ok.bind(this);
    this.info = this.info.bind(this);
    this.error = this.error.bind(this);
    this.fatal = this.fatal.bind(this);
    this.debug = this.debug.bind(this);
    this.verbose = this.verbose.bind(this);
  }
  fatal(message, metadata) {
    this._logWithStack("fatal" /* FATAL */, message, metadata);
  }
  error(message, metadata) {
    this._logWithStack("error" /* ERROR */, message, metadata);
  }
  ok(message, metadata) {
    this._logWithStack("ok", message, metadata);
  }
  info(message, metadata) {
    this._logWithStack("info" /* INFO */, message, metadata);
  }
  debug(message, metadata) {
    this._logWithStack("debug" /* DEBUG */, message, metadata);
  }
  verbose(message, metadata) {
    this._logWithStack("verbose" /* VERBOSE */, message, metadata);
  }
  _logWithStack(type, message, metadata) {
    this._log(type, message);
    if (typeof metadata === "string") {
      this._log(type, metadata);
      return;
    }
    if (metadata) {
      let stack = metadata?.error?.stack || metadata?.stack;
      if (!stack) {
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
        const colorizedStack = this._colorizeText(prettyStack, "\x1B[2m" /* dim */);
        this._log(type, colorizedStack);
      } else if (stack) {
        const prettyStack = this._formatStackTrace(stack.join("\n"), 1);
        const colorizedStack = this._colorizeText(prettyStack, "\x1B[2m" /* dim */);
        this._log(type, colorizedStack);
      } else {
        throw new Error("Stack is null");
      }
    }
  }
  _colorizeText(text, color) {
    if (!color) {
      throw new Error(`Invalid color: ${color}`);
    }
    return color.concat(text).concat("\x1B[0m" /* reset */);
  }
  _formatStackTrace(stack, linesToRemove = 0, prefix = "") {
    const lines = stack.split("\n");
    for (let i = 0; i < linesToRemove; i++) {
      lines.shift();
    }
    return lines.map((line) => `${prefix}${line.replace(/\s*at\s*/, "  \u21B3  ")}`).join("\n");
  }
  _isEmpty(obj) {
    return !Reflect.ownKeys(obj).some((key) => typeof obj[String(key)] !== "function");
  }
  _log(type, message) {
    const defaultSymbols = {
      fatal: "\xD7",
      ok: "\u2713",
      error: "\u26A0",
      info: "\u203A",
      debug: "\u203A\u203A",
      verbose: "\u{1F4AC}"
    };
    const symbol = defaultSymbols[type];
    const messageFormatted = typeof message === "string" ? message : util.inspect(message, { showHidden: true, depth: null, breakLength: Infinity });
    const lines = messageFormatted.split("\n");
    const logString = lines.map((line, index) => {
      const prefix = index === 0 ? `	${symbol}` : `	${" ".repeat(symbol.length)}`;
      return `${prefix} ${line}`;
    }).join("\n");
    const fullLogString = logString;
    const colorMap = {
      fatal: ["error", "\x1B[31m" /* fgRed */],
      ok: ["log", "\x1B[32m" /* fgGreen */],
      error: ["warn", "\x1B[33m" /* fgYellow */],
      info: ["info", "\x1B[2m" /* dim */],
      debug: ["debug", "\x1B[35m" /* fgMagenta */],
      verbose: ["debug", "\x1B[2m" /* dim */]
    };
    const _console = console[colorMap[type][0]];
    if (typeof _console === "function") {
      _console(this._colorizeText(fullLogString, colorMap[type][1]));
    } else {
      throw new Error(fullLogString);
    }
  }
};
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2["FATAL"] = "fatal";
  LogLevel2["ERROR"] = "error";
  LogLevel2["INFO"] = "info";
  LogLevel2["VERBOSE"] = "verbose";
  LogLevel2["DEBUG"] = "debug";
  return LogLevel2;
})(LogLevel || {});
export {
  LogLevel,
  PrettyLogs
};
//# sourceMappingURL=pretty-logs.js.map