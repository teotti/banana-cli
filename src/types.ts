export type ErrorType = "api" | "cancelled" | "config" | "network" | "usage";
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
  | "friend-groups"
  | "members"
  | "activities"
  | "expense-list"
  | "expense"
  | "payment"
  | "expense-updated"
  | "expense-created"
  | "payment-created"
  | "group-created";
export type BrowserPresentation =
  | "balance-users"
  | "friend-list"
  | "group-list"
  | "friend-groups"
  | "expense-list"
  | "members"
  | "activities";
export type BrowserDetailLoader = (
  item: Record<string, unknown>,
) => Promise<string>;
export type BrowserPageLoader = (cursor: string) => Promise<unknown>;
/** A collection reachable from an item's detail view, opened with `key`. */
export type BrowserLink = {
  key: string;
  label: string;
  presentation: BrowserPresentation;
  path: string;
  query?: URLSearchParams;
};
export type BrowserLinks = (item: Record<string, unknown>) => BrowserLink[];
export type BrowserLevel = {
  presentation: BrowserPresentation;
  body: unknown;
  loadDetail: BrowserDetailLoader;
  loadPage?: BrowserPageLoader;
  links?: BrowserLinks;
};
export type BrowserNesting = {
  links?: BrowserLinks;
  open: (link: BrowserLink) => Promise<BrowserLevel>;
};
export type Browser = (
  presentation: BrowserPresentation,
  body: unknown,
  loadDetail: BrowserDetailLoader,
  loadPage?: BrowserPageLoader,
  nested?: BrowserNesting,
) => Promise<boolean>;
export type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;
export type SecureStorage = Pick<typeof Bun.secrets, "get" | "set" | "delete">;
export type Sleep = (
  milliseconds: number,
  signal: AbortSignal,
) => Promise<void>;

export interface CliRuntime {
  browser?: Browser;
  env?: Environment;
  fetch?: Fetch;
  now?: () => number;
  openUrl?: (url: string) => Promise<void>;
  pager?: Pager;
  secrets?: SecureStorage;
  sleep?: Sleep;
  stderr?: OutputWriter;
  stdout?: OutputWriter;
  timeoutMs?: number;
  update?: () => Promise<string>;
}

export type RequestCommand = {
  kind: "request";
  path: string;
  presentation: Presentation;
  query?: URLSearchParams;
  method?: "POST" | "PUT";
  body?: unknown;
  mergeExpense?: string;
};

export type HelpCommand = {
  kind: "help";
  text: string;
};

export type AuthCommand = {
  action: "login" | "logout";
  kind: "auth";
};

export type ParsedCommand = AuthCommand | HelpCommand | RequestCommand;
export type CommandParser = (args: string[]) => ParsedCommand;

export type BrowserPresenter = {
  detailPath: (
    command: RequestCommand,
    item: Record<string, unknown>,
  ) => string;
  formatDetail: (item: Record<string, unknown>, body: unknown) => string;
  /** Collections the detail view of one item can drill into. */
  links?: (
    command: RequestCommand,
    item: Record<string, unknown>,
  ) => BrowserLink[];
};

export type Presenter = {
  clean: (body: unknown) => unknown;
  format: (body: unknown) => string;
  browser?: BrowserPresenter;
};

export class CliFailure extends Error {
  /** The help page to print under the message; usage errors carry one. */
  help?: string;

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
