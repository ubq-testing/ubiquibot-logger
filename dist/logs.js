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

// src/supabase/types/log-types.ts
var LogReturn = class {
  logMessage;
  metadata;
  constructor(logMessage, metadata) {
    this.logMessage = logMessage;
    this.metadata = metadata;
  }
};

// src/supabase/helpers/tables/logs.ts
var Logs = class _Logs {
  _maxLevel = -1;
  static console;
  _log({ level, consoleLog, logMessage, metadata, type }) {
    if (this._getNumericLevel(level) > this._maxLevel)
      return null;
    consoleLog(logMessage, metadata || void 0);
    return new LogReturn(
      {
        raw: logMessage,
        diff: this._diffColorCommentMessage(type, logMessage),
        type,
        level
      },
      metadata
    );
  }
  _addDiagnosticInformation(metadata) {
    if (!metadata) {
      metadata = {};
    }
    if (typeof metadata == "string" || typeof metadata == "number") {
      metadata = { message: metadata };
    }
    const stackLines = new Error().stack?.split("\n") || [];
    if (stackLines.length > 3) {
      const callerLine = stackLines[3];
      const match = callerLine.match(/at (\S+)/);
      if (match) {
        metadata.caller = match[1];
      }
    }
    return metadata;
  }
  ok(log, metadata, postComment) {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.INFO,
      consoleLog: _Logs.console.ok,
      logMessage: log,
      metadata,
      postComment,
      type: "ok"
    });
  }
  info(log, metadata, postComment) {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.INFO,
      consoleLog: _Logs.console.info,
      logMessage: log,
      metadata,
      postComment,
      type: "info"
    });
  }
  error(log, metadata, postComment) {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.ERROR,
      consoleLog: _Logs.console.error,
      logMessage: log,
      metadata,
      postComment,
      type: "error"
    });
  }
  debug(log, metadata, postComment) {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.DEBUG,
      consoleLog: _Logs.console.debug,
      logMessage: log,
      metadata,
      postComment,
      type: "debug"
    });
  }
  fatal(log, metadata, postComment) {
    if (!metadata) {
      metadata = _Logs.convertErrorsIntoObjects(new Error(log));
      const stack = metadata.stack;
      stack.splice(1, 1);
      metadata.stack = stack;
    }
    if (metadata instanceof Error) {
      metadata = _Logs.convertErrorsIntoObjects(metadata);
      const stack = metadata.stack;
      stack.splice(1, 1);
      metadata.stack = stack;
    }
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.FATAL,
      consoleLog: _Logs.console.fatal,
      logMessage: log,
      metadata,
      postComment,
      type: "fatal"
    });
  }
  verbose(log, metadata, postComment) {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: LOG_LEVEL.VERBOSE,
      consoleLog: _Logs.console.verbose,
      logMessage: log,
      metadata,
      postComment,
      type: "verbose"
    });
  }
  constructor(logLevel) {
    this._maxLevel = this._getNumericLevel(logLevel);
    _Logs.console = new PrettyLogs();
  }
  static _commentMetaData(metadata, level) {
    _Logs.console.debug("the main place that metadata is being serialized as an html comment");
    const prettySerialized = JSON.stringify(metadata, null, 2);
    if (level === LOG_LEVEL.FATAL) {
      return ["```json", prettySerialized, "```"].join("\n");
    } else {
      return ["<!--", prettySerialized, "-->"].join("\n");
    }
  }
  _diffColorCommentMessage(type, message) {
    const diffPrefix = {
      fatal: "-",
      // - text in red
      ok: "+",
      // + text in green
      error: "!"
      // ! text in orange
      // info: "#", // # text in gray
      // debug: "@@@@",// @@ text in purple (and bold)@@
      // error: null,
      // warn: null,
      // info: null,
      // verbose: "#",
      // debug: "#",
    };
    const selected = diffPrefix[type];
    if (selected) {
      message = message.trim().split("\n").map((line) => `${selected} ${line}`).join("\n");
    } else if (type === "debug") {
      message = message.split("\n").map((line) => `@@ ${line} @@`).join("\n");
    } else {
      message = message.split("\n").map((line) => `# ${line}`).join("\n");
    }
    const diffHeader = "```diff";
    const diffFooter = "```";
    return [diffHeader, message, diffFooter].join("\n");
  }
  _getNumericLevel(level) {
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
        return -1;
    }
  }
  static convertErrorsIntoObjects(obj) {
    if (obj instanceof Error) {
      return {
        message: obj.message,
        name: obj.name,
        stack: obj.stack ? obj.stack.split("\n") : null
      };
    } else if (typeof obj === "object" && obj !== null) {
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        obj[key] = this.convertErrorsIntoObjects(obj[key]);
      });
    }
    return obj;
  }
};
export {
  Logs
};
//# sourceMappingURL=logs.js.map