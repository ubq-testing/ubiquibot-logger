import { PrettyLogs } from "../src/supabase/helpers/tables/pretty-logs";

const ansiEscapeCodes = /\x1b\[\d+m|\s/g;

function cleanSpyLogs(
  spy: jest.SpiedFunction<{
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
  }>
) {
  const strs = spy.mock.calls.map((call) => call.map((str) => str.toString()).join(" "));
  return strs.flat().map((str) => cleanLogString(str));
}

function cleanLogString(logString: string) {
  return logString.replace(ansiEscapeCodes, "").replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "");
}

describe("PrettyLogs", () => {
  let logs: PrettyLogs;

  beforeEach(() => {
    logs = new PrettyLogs();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should log an 'ok' message", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation();
    const logReturn = logs.ok("This is an OK message");
    expect(logReturn).toBeUndefined();
    const cleanLogStrings = cleanSpyLogs(logSpy);
    expect(cleanLogStrings).toContain(cleanLogString("✓ This is an OK message"));
  });

  it("should log an 'info' message", () => {
    const logSpy = jest.spyOn(console, "info").mockImplementation();
    const logReturn = logs.info("This is an INFO message");
    expect(logReturn).toBeUndefined();
    const cleanLogStrings = cleanSpyLogs(logSpy);
    expect(cleanLogStrings).toContain(cleanLogString(" › This is an INFO message"));
  });

  it("should log an 'error' message", () => {
    const logSpy = jest.spyOn(console, "warn").mockImplementation();
    const logReturn = logs.error("This is an ERROR message");
    expect(logReturn).toBeUndefined();
    const cleanLogStrings = cleanSpyLogs(logSpy);
    expect(cleanLogStrings).toContain(cleanLogString(" ⚠ This is an ERROR message"));
  });

  it("should log a 'debug' message", () => {
    const logSpy = jest.spyOn(console, "debug").mockImplementation();
    const logReturn = logs.debug("This is a DEBUG message");
    expect(logReturn).toBeUndefined();
    const cleanLogStrings = cleanSpyLogs(logSpy);
    expect(cleanLogStrings).toContain(cleanLogString(" ›› This is a DEBUG message"))
  });

  it("should log a 'fatal' message", () => {
    const logSpy = jest.spyOn(console, "error").mockImplementation();
    const logReturn = logs.fatal("This is a FATAL message");
    expect(logReturn).toBeUndefined();
    const cleanLogStrings = cleanSpyLogs(logSpy);
    expect(cleanLogStrings).toContain(cleanLogString(" × This is a FATAL message"));
  });

  it("should log a 'verbose' message", () => {
    const logSpy = jest.spyOn(console, "debug").mockImplementation();
    const logReturn = logs.verbose("This is a VERBOSE message");
    expect(logReturn).toBeUndefined();
    const cleanLogStrings = cleanSpyLogs(logSpy);
    expect(cleanLogStrings).toContain(cleanLogString((" 💬 This is a VERBOSE message")));
  });
});