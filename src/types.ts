export type ErrorType = "api" | "config" | "network" | "usage";
export type Environment = Record<string, string | undefined>;
export type OutputWriter = (value: string) => void;
export type OutputMode = "human" | "json" | "raw";
export type Pager = (value: string) => Promise<boolean>;
export type Presentation =
  | "user"
  | "balance"
  | "balance-users"
  | "currency-list"
  | "friend-list"
  | "group-list"
  | "group"
  | "members"
  | "activities"
  | "expense-created"
  | "payment-created"
  | "group-created";
export type BrowserPresentation =
  | "balance-users"
  | "friend-list"
  | "group-list"
  | "members"
  | "activities";
export type BrowserDetailLoader = (
  item: Record<string, unknown>,
) => Promise<string>;
export type Browser = (
  presentation: BrowserPresentation,
  body: unknown,
  loadDetail: BrowserDetailLoader,
) => Promise<boolean>;
export type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface CliRuntime {
  browser?: Browser;
  env?: Environment;
  fetch?: Fetch;
  pager?: Pager;
  stderr?: OutputWriter;
  stdout?: OutputWriter;
  timeoutMs?: number;
}

export type RequestCommand = {
  kind: "request";
  path: string;
  presentation: Presentation;
  query?: URLSearchParams;
  method?: "POST";
  body?: unknown;
};

export type HelpCommand = {
  kind: "help";
  text: string;
};

export type ParsedCommand = HelpCommand | RequestCommand;
export type CommandParser = (args: string[]) => ParsedCommand;

export type BrowserPresenter = {
  detailPath: (
    command: RequestCommand,
    item: Record<string, unknown>,
  ) => string;
  formatDetail: (item: Record<string, unknown>, body: unknown) => string;
};

export type Presenter = {
  clean: (body: unknown) => unknown;
  format: (body: unknown) => string;
  browser?: BrowserPresenter;
};

export class CliFailure extends Error {
  constructor(
    readonly type: ErrorType,
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

export type OptionConfig = Record<
  string,
  { type: "boolean" | "string"; short?: string; multiple?: boolean }
>;
