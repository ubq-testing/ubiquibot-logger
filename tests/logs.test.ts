import { SupabaseClient } from "@supabase/supabase-js";
import { LOG_LEVEL } from "../src/constants";
import { Logs } from "../src/logs";
import { LogReturn } from "../src/types/log-types";

jest.mock("@supabase/supabase-js", () => {
  return {
    SupabaseClient: jest.fn().mockImplementation(() => {
      return {
        from: jest.fn().mockImplementation(() => {
          throw new Error("This is the error you are looking for.");
        }),
      };
    }),
  };
});

describe("Logs", () => {
  let logs: Logs;

  beforeEach(() => {
    logs = new Logs(LOG_LEVEL.DEBUG, "test");
  });

  it("should log an 'ok' message", () => {
    const logReturn = logs.ok("This is an OK message");
    expect(logReturn).not.toBeNull();
  });

  it("should log an 'info' message", () => {
    const logReturn = logs.info("This is an INFO message");
    expect(logReturn).not.toBeNull();
  });

  it("should log an 'error' message", () => {
    const logReturn = logs.error("This is an ERROR message");
    expect(logReturn).not.toBeNull();
  });

  it("should log a 'debug' message", () => {
    const logReturn = logs.debug("This is a DEBUG message");
    expect(logReturn).not.toBeNull();
  });

  it("should log a 'fatal' message", () => {
    const logReturn = logs.fatal("This is a FATAL message");
    expect(logReturn).not.toBeNull();
  });

  it("should log a 'verbose' message", () => {
    const logReturn = logs.verbose("This is a VERBOSE message");
    expect(logReturn).not.toBeNull();
  });

  it("should return a LogReturn object", () => {
    const logReturn: LogReturn | null = logs.ok("This is an OK message");
    expect(logReturn).toBeInstanceOf(LogReturn);
    const msg = logReturn?.logMessage;
    const metadata = logReturn?.metadata;
    expect(msg).toHaveProperty("diff");
    expect(metadata).toHaveProperty("caller");
  });

  it("should log an error when _logToSupabase throws an error", async () => {
    const supabaseClient = new SupabaseClient("test", "test");
    const logger = new Logs(LOG_LEVEL.DEBUG, "test", { levelsToLog: ["fatal"], supabaseClient });
    const spy = jest.spyOn(console, "error");
    logger.fatal("This is not the error you are looking for");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenLastCalledWith("Error logging to Supabase:", new Error("This is the error you are looking for."));
  });
});
