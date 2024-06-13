// src/supabase/helpers/tables/pretty-logs.ts
import util from "util";

// src/supabase/constants.ts
var COLORS = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  underscore: "\x1B[4m",
  blink: "\x1B[5m",
  reverse: "\x1B[7m",
  hidden: "\x1B[8m",
  fgBlack: "\x1B[30m",
  fgRed: "\x1B[31m",
  fgGreen: "\x1B[32m",
  fgYellow: "\x1B[33m",
  fgBlue: "\x1B[34m",
  fgMagenta: "\x1B[35m",
  fgCyan: "\x1B[36m",
  fgWhite: "\x1B[37m",
  bgBlack: "\x1B[40m",
  bgRed: "\x1B[41m",
  bgGreen: "\x1B[42m",
  bgYellow: "\x1B[43m",
  bgBlue: "\x1B[44m",
  bgMagenta: "\x1B[45m",
  bgCyan: "\x1B[46m",
  bgWhite: "\x1B[47m"
};
var LOG_LEVEL = {
  FATAL: "fatal",
  ERROR: "error",
  INFO: "info",
  VERBOSE: "verbose",
  DEBUG: "debug"
};

// src/supabase/helpers/tables/pretty-logs.ts
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
    this._logWithStack(LOG_LEVEL.FATAL, message, metadata);
  }
  error(message, metadata) {
    this._logWithStack(LOG_LEVEL.ERROR, message, metadata);
  }
  ok(message, metadata) {
    this._logWithStack("ok", message, metadata);
  }
  info(message, metadata) {
    this._logWithStack(LOG_LEVEL.INFO, message, metadata);
  }
  debug(message, metadata) {
    this._logWithStack(LOG_LEVEL.DEBUG, message, metadata);
  }
  verbose(message, metadata) {
    this._logWithStack(LOG_LEVEL.VERBOSE, message, metadata);
  }
  _logWithStack(type, message, metaData) {
    this._log(type, message);
    if (typeof metaData === "string") {
      this._log(type, metaData);
      return;
    }
    if (metaData) {
      const metadata = metaData;
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
        const colorizedStack = this._colorizeText(prettyStack, COLORS.dim);
        this._log(type, colorizedStack);
      } else if (stack) {
        const prettyStack = this._formatStackTrace(stack.join("\n"), 1);
        const colorizedStack = this._colorizeText(prettyStack, COLORS.dim);
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
    return color.concat(text).concat(COLORS.reset);
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
      fatal: ["error", COLORS.fgRed],
      ok: ["log", COLORS.fgGreen],
      error: ["warn", COLORS.fgYellow],
      info: ["info", COLORS.dim],
      debug: ["debug", COLORS.fgMagenta],
      verbose: ["debug", COLORS.dim]
    };
    const _console = console[colorMap[type][0]];
    if (typeof _console === "function") {
      _console(this._colorizeText(fullLogString, colorMap[type][1]));
    } else {
      throw new Error(fullLogString);
    }
  }
};
export {
  PrettyLogs
};
//# sourceMappingURL=pretty-logs.js.map