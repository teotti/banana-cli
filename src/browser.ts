import { spawn, spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { asArray, asRecord, display } from "./shared";
import {
  CliFailure,
  type BrowserDetailLoader,
  type BrowserPageLoader,
  type BrowserPresentation,
  type Presentation,
} from "./types";

const PAGER_PROMPT = "↑/↓ navigate · q quit";
const ANSI = {
  bold: "\x1b[1m",
  yellow: "\x1b[38;2;255;228;0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

type BrowserDetailState =
  | { status: "loading"; title: string }
  | { status: "loaded"; title: string; value: string }
  | { status: "error"; title: string; message: string };

export function hasInteractivePager() {
  if (process.env.CI || spawnSync("less", ["--version"]).status !== 0) {
    return false;
  }
  try {
    const terminal = openSync("/dev/tty", "r+");
    closeSync(terminal);
    return true;
  } catch {
    return false;
  }
}

export async function pageWithLess(value: string) {
  let terminal: number;
  try {
    terminal = openSync("/dev/tty", "r+");
  } catch {
    return false;
  }

  try {
    const pager = spawn("less", ["-X", "-Q", `-Ps${PAGER_PROMPT}`], {
      stdio: ["pipe", terminal, terminal],
    });
    const exited = new Promise<boolean>((resolve) => {
      pager.once("error", () => resolve(false));
      pager.once("close", (code) => resolve(code === 0));
    });
    if (!pager.stdin) {
      pager.kill();
      return false;
    }
    pager.stdin.end(`${value}\n`);
    return await exited;
  } finally {
    closeSync(terminal);
  }
}

export function isListPresentation(presentation: Presentation) {
  return (
    presentation === "balance-users" ||
    presentation === "currency-list" ||
    presentation === "expense-list" ||
    presentation === "friend-list" ||
    presentation === "group-list" ||
    presentation === "members" ||
    presentation === "activities"
  );
}

export function isBrowserPresentation(
  presentation: Presentation,
): presentation is BrowserPresentation {
  return (
    presentation === "expense-list" ||
    presentation === "balance-users" ||
    presentation === "friend-list" ||
    presentation === "group-list" ||
    presentation === "members" ||
    presentation === "activities"
  );
}

function browserItems(presentation: BrowserPresentation, body: unknown) {
  return asArray(
    presentation === "group-list" ||
    presentation === "friend-list" ||
    presentation === "expense-list"
      ? asRecord(body).items
      : body,
  ).map(asRecord);
}

function filterBrowserItems(
  presentation: BrowserPresentation,
  body: unknown,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  return browserItems(presentation, body).filter((item) =>
    JSON.stringify(item).toLowerCase().includes(normalizedQuery),
  );
}

function browserItemTitle(
  presentation: BrowserPresentation,
  item: Record<string, unknown>,
) {
  if (presentation === "balance-users" || presentation === "friend-list") {
    return display(asRecord(item.user).name);
  }
  if (presentation === "group-list" || presentation === "members") {
    return display(item.name);
  }
  return item.entity === "payment"
    ? `Payment: ${display(item.description)}`
    : `Expense: ${display(item.title)}`;
}

export function renderCollectionBrowser(
  presentation: BrowserPresentation,
  body: unknown,
  query = "",
  selectedIndex = 0,
  detail?: BrowserDetailState,
  rows = Infinity,
  pageStatus?: string,
) {
  if (detail) {
    return [
      `${ANSI.bold}${ANSI.yellow}BANANA${ANSI.reset}`,
      "",
      `◆ ${ANSI.bold}${detail.title}${ANSI.reset}`,
      `  ${ANSI.dim}esc/← back · q quit${ANSI.reset}`,
      "",
      detail.status === "loading"
        ? `${ANSI.dim}Loading details…${ANSI.reset}`
        : detail.status === "error"
          ? `Unable to load details: ${detail.message}`
          : detail.value,
    ].join("\n");
  }

  const response = asRecord(body);
  const normalizedQuery = query.trim().toLowerCase();
  const allItems = browserItems(presentation, body);
  const items = filterBrowserItems(presentation, body, query);
  const activeIndex = Math.min(selectedIndex, Math.max(items.length - 1, 0));
  const visibleCount = Math.max(1, rows - 13);
  const start = Math.max(0, activeIndex - visibleCount + 1);
  const label = {
    "balance-users": "user balances",
    "friend-list": "friends",
    "group-list": "groups",
    "expense-list": "expenses",
    members: "group members",
    activities: "group activities",
  }[presentation];
  const count = `${ANSI.green}${items.length}${
    normalizedQuery ? `/${allItems.length}` : ""
  }${ANSI.reset}`;
  const lines = [
    `${ANSI.bold}${ANSI.yellow}BANANA${ANSI.reset}`,
    "",
    `┌─ ${ANSI.yellow} ${label} ${ANSI.reset}`,
    "│",
    `◇ Found ${count} ${label}`,
    "│",
    `◆ ${ANSI.bold}Browse ${label}${ANSI.reset}`,
    `  Search: ${query}${ANSI.yellow}█${ANSI.reset}`,
    `  ${ANSI.dim}↑↓ move · type search · enter/→ details · esc/← clear · q quit${ANSI.reset}`,
    "",
    ...(items.length
      ? items.slice(start, start + visibleCount).map(
          (item, index) =>
            `${start + index === activeIndex ? `${ANSI.yellow}› ●${ANSI.reset}` : "  ○"} ${browserItemTitle(presentation, item)}`,
        )
      : [`  ${ANSI.dim}No matching ${label}.${ANSI.reset}`]),
  ];

  if (pageStatus) {
    lines.push("", pageStatus);
  } else if (
    (presentation === "group-list" ||
      presentation === "friend-list" ||
      presentation === "expense-list") &&
    response.hasMore
  ) {
    lines.push(
      "",
      `${ANSI.dim}${presentation === "expense-list"
        ? "Reach the last item to load more expenses (↓ to continue)."
        : `More ${label} are available from the API.`}${ANSI.reset}`,
    );
  }
  return lines.join("\n");
}

export function renderGroupBrowser(
  body: unknown,
  query = "",
  selectedIndex = 0,
) {
  return renderCollectionBrowser("group-list", body, query, selectedIndex);
}

export function hasInteractiveBrowser() {
  return Boolean(
    !process.env.CI &&
      process.stdin.isTTY &&
      process.stdout.isTTY &&
      typeof process.stdin.setRawMode === "function",
  );
}

export async function browseCollection(
  presentation: BrowserPresentation,
  body: unknown,
  loadDetail: BrowserDetailLoader,
  loadPage?: BrowserPageLoader,
) {
  if (!hasInteractiveBrowser()) return false;

  const input = process.stdin;
  const output = process.stdout;
  const wasRaw = input.isRaw;
  let query = "";
  let selectedIndex = 0;
  let detail: BrowserDetailState | undefined;
  let detailGeneration = 0;
  let finished = false;
  let loadingPage = false;
  let pageStatus: string | undefined;

  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  output.write("\x1b[?1049h\x1b[?25l");

  return await new Promise<boolean>((resolve) => {
    const draw = () => {
      if (finished) return;
      output.write(
        `\x1b[H\x1b[2J${renderCollectionBrowser(presentation, body, query, selectedIndex, detail, output.rows, pageStatus)}`,
      );
    };
    const finish = () => {
      finished = true;
      detailGeneration++;
      input.off("keypress", onKeypress);
      process.off("SIGWINCH", draw);
      input.setRawMode(wasRaw);
      input.pause();
      output.write("\x1b[?25h\x1b[?1049l");
      resolve(true);
    };
    const openDetail = async (item: Record<string, unknown>) => {
      const generation = ++detailGeneration;
      const title = browserItemTitle(presentation, item);
      detail = { status: "loading", title };
      draw();
      try {
        const value = await loadDetail(item);
        if (finished || generation !== detailGeneration) return;
        detail = { status: "loaded", title, value };
      } catch (error) {
        if (finished || generation !== detailGeneration) return;
        detail = {
          status: "error",
          title,
          message:
            error instanceof CliFailure ? error.message : "Unexpected error",
        };
      }
      draw();
    };
    const loadNextPage = async () => {
      const response = asRecord(body);
      const cursor = response.nextCursor;
      if (finished || loadingPage || !loadPage || !response.hasMore ||
          typeof cursor !== "string" || !cursor) return;
      loadingPage = true;
      pageStatus = "Loading more expenses…";
      draw();
      try {
        const page = asRecord(await loadPage(cursor));
        if (finished) return;
        if (page.hasMore && page.nextCursor === cursor) {
          throw new CliFailure("api", "Expense pagination did not advance");
        }
        body = { ...page, items: [...asArray(response.items), ...asArray(page.items)] };
        pageStatus = undefined;
      } catch (error) {
        if (finished) return;
        pageStatus = `Unable to load more expenses: ${error instanceof CliFailure
          ? error.message : "Unexpected error"}. Press ↓ to retry.`;
      } finally {
        loadingPage = false;
      }
      draw();
    };
    const onKeypress = (
      text: string,
      key: { ctrl?: boolean; meta?: boolean; name?: string },
    ) => {
      const itemCount = filterBrowserItems(presentation, body, query).length;
      if ((key.ctrl && key.name === "c") || key.name === "q") {
        finish();
        return;
      }
      if (detail) {
        if (key.name === "escape" || key.name === "left") {
          detailGeneration++;
          detail = undefined;
          draw();
        }
        return;
      }
      if (key.name === "escape" || key.name === "left") {
        query = "";
        selectedIndex = 0;
      } else if (key.name === "up") {
        selectedIndex = Math.max(0, selectedIndex - 1);
      } else if (key.name === "down") {
        selectedIndex = Math.min(Math.max(itemCount - 1, 0), selectedIndex + 1);
        if (selectedIndex >= itemCount - 1) void loadNextPage();
      } else if (key.name === "backspace" || key.name === "delete") {
        query = query.slice(0, -1);
        selectedIndex = 0;
      } else if (key.name === "return" || key.name === "enter" || key.name === "right") {
        const items = filterBrowserItems(presentation, body, query);
        const selected = items[Math.min(selectedIndex, items.length - 1)];
        if (selected) void openDetail(selected);
        return;
      } else if (
        text &&
        !key.ctrl &&
        !key.meta &&
        text >= " " &&
        text !== "\x7f"
      ) {
        query += text;
        selectedIndex = 0;
      }
      draw();
    };

    input.on("keypress", onKeypress);
    process.on("SIGWINCH", draw);
    draw();
  });
}
