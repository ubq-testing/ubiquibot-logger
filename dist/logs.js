// src/commit-hash.ts
import { execSync } from "child_process";
var COMMIT_HASH = null;
try {
  COMMIT_HASH = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
}

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

// src/supabase/helpers/tables/logs.ts
var LogReturn = class {
  logMessage;
  metadata;
  constructor(logMessage, metadata) {
    this.logMessage = logMessage;
    this.metadata = metadata;
  }
};
var Logs = class _Logs {
  _supabase;
  _context = null;
  _maxLevel = -1;
  _queue = [];
  // Your log queue
  _concurrency = 6;
  // Maximum concurrent requests
  _retryDelay = 1e3;
  // Delay between retries in milliseconds
  _throttleCount = 0;
  _retryLimit = 0;
  // Retries disabled by default
  static console;
  _log({ level, consoleLog, logMessage, metadata, postComment, type }) {
    if (this._getNumericLevel(level) > this._maxLevel)
      return null;
    consoleLog(logMessage, metadata || void 0);
    if (this._context && postComment) {
      const colorizedCommentMessage = this._diffColorCommentMessage(type, logMessage);
      const commentMetaData = metadata ? _Logs._commentMetaData(metadata, level) : null;
      this._postComment(metadata ? [colorizedCommentMessage, commentMetaData].join("\n") : colorizedCommentMessage);
    }
    const toSupabase = { log: logMessage, level, metadata };
    this._save(toSupabase);
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
    const gitCommit = COMMIT_HASH?.substring(0, 7) ?? null;
    metadata.revision = gitCommit;
    return metadata;
  }
  ok(log, metadata, postComment) {
    metadata = this._addDiagnosticInformation(metadata);
    return this._log({
      level: "info" /* INFO */,
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
      level: "info" /* INFO */,
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
      level: "error" /* ERROR */,
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
      level: "debug" /* DEBUG */,
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
      level: "fatal" /* FATAL */,
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
      level: "verbose" /* VERBOSE */,
      consoleLog: _Logs.console.verbose,
      logMessage: log,
      metadata,
      postComment,
      type: "verbose"
    });
  }
  constructor(supabase, retryLimit, logLevel, context) {
    this._supabase = supabase;
    this._context = context;
    this._retryLimit = retryLimit;
    this._maxLevel = this._getNumericLevel(logLevel);
    _Logs.console = new PrettyLogs();
  }
  async _sendLogsToSupabase(log) {
    const { error } = await this._supabase.from("logs").insert(log);
    if (error)
      throw _Logs.console.fatal("Error logging to Supabase:", error);
  }
  async _processLogs(log) {
    try {
      await this._sendLogsToSupabase(log);
    } catch (error) {
      _Logs.console.fatal("Error sending log, retrying:", error);
      return this._retryLimit > 0 ? await this._retryLog(log) : null;
    }
  }
  async _retryLog(log, retryCount = 0) {
    if (retryCount >= this._retryLimit) {
      _Logs.console.fatal("Max retry limit reached for log:", log);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, this._retryDelay));
    try {
      await this._sendLogsToSupabase(log);
    } catch (error) {
      _Logs.console.fatal("Error sending log (after retry):", error);
      await this._retryLog(log, retryCount + 1);
    }
  }
  async _processLogQueue() {
    while (this._queue.length > 0) {
      const log = this._queue.shift();
      if (!log) {
        continue;
      }
      await this._processLogs(log);
    }
  }
  async _throttle() {
    if (this._throttleCount >= this._concurrency) {
      return;
    }
    this._throttleCount++;
    try {
      await this._processLogQueue();
    } finally {
      this._throttleCount--;
      if (this._queue.length > 0) {
        await this._throttle();
      }
    }
  }
  async _addToQueue(log) {
    this._queue.push(log);
    if (this._throttleCount < this._concurrency) {
      await this._throttle();
    }
  }
  _save(logInsert) {
    this._addToQueue(logInsert).then(() => void 0).catch(() => _Logs.console.fatal("Error adding logs to queue"));
    _Logs.console.ok(logInsert.log, logInsert);
  }
  static _commentMetaData(metadata, level) {
    _Logs.console.debug("the main place that metadata is being serialized as an html comment");
    const prettySerialized = JSON.stringify(metadata, null, 2);
    if (level === "fatal" /* FATAL */) {
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
  _postComment(message) {
    if (!this._context)
      return;
    this._context.octokit.issues.createComment({
      owner: this._context.issue().owner,
      repo: this._context.issue().repo,
      issue_number: this._context.issue().issue_number,
      body: message
    }).catch((x) => console.trace(x));
  }
  _getNumericLevel(level) {
    switch (level) {
      case "fatal" /* FATAL */:
        return 0;
      case "error" /* ERROR */:
        return 1;
      case "info" /* INFO */:
        return 2;
      case "verbose" /* VERBOSE */:
        return 4;
      case "debug" /* DEBUG */:
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
  LogReturn,
  Logs
};
//# sourceMappingURL=logs.js.map