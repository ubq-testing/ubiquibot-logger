import { LOG_LEVEL } from "../src/constants";
import { Logs } from "../src/logs";
import { LogReturn } from "../src/types/log-types";

describe("Logs", () => {
  let logs: Logs;

  beforeEach(() => {
    logs = new Logs(LOG_LEVEL.DEBUG);
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
});
