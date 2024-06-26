// eslint-disable-next-line no-control-regex
const ansiEscapeCodes = /\x1b\[\d+m|\s/g;

function cleanLogs(
  spy: jest.SpiedFunction<{
    (...data: string[]): void;
    (message?: string, ...optionalParams: string[]): void;
  }>
) {
  const strs = spy.mock.calls.map((call) => call.map((str) => str?.toString()).join(" "));
  return strs.flat().map((str) => cleanLogString(str));
}

export function cleanLogString(logString: string) {
  return logString.replaceAll(ansiEscapeCodes, "").replaceAll(/\n/g, "").replaceAll(/\r/g, "").replaceAll(/\t/g, "").trim();
}

export function cleanSpyLogs(
  spy: jest.SpiedFunction<{
    (...data: string[]): void;
    (message?: string, ...optionalParams: string[]): void;
  }>
): string[] {
  return cleanLogs(spy);
}

export function tryError() {
  try {
    throw new Error("This is an error");
  } catch (e) {
    return e as Error;
  }
}
