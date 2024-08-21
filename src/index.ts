import { Logs } from "./logs";
import { PrettyLogs } from "./pretty-logs";
import { LogReturn, Metadata, LogLevel, LogLevelWithOk, Colors } from "./types/log-types";
import { cleanLogString, cleanSpyLogs } from "./utils";
import { LOG_LEVEL, COLORS } from "./constants";

export type { Metadata, LogLevel, LogLevelWithOk, Colors };
export { Logs, PrettyLogs, LogReturn, cleanLogString, cleanSpyLogs, LOG_LEVEL, COLORS };
