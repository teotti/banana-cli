import { spawn, spawnSync } from "node:child_process";
import { BOLD, DIM, GREEN, RESET, YELLOW } from "./colors";
import { closeSync, openSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { asArray, asRecord, display } from "./shared";
import {
  CliFailure,
  type BrowserDetailLoader,
  type BrowserLevel,
  type BrowserLink,
  type BrowserNesting,
  type BrowserPageLoader,
  type BrowserPresentation,
  type Presentation,
} from "./types";

const PAGER_PROMPT = "↑/↓ navigate · q quit";
const ANSI = {
  bold: BOLD,
  yellow: YELLOW,
  dim: DIM,
  green: GREEN,
  reset: RESET,
};

type BrowserDetailState = { title: string; links?: BrowserLink[] } & (
  | { status: "loading" }
  | { status: "loaded"; value: string }
  | { status: "error"; message: string }
);

/** One collection on the browsing stack, with the state of its screen. */
type BrowserStackLevel = BrowserLevel & {
  query: string;
  selectedIndex: number;
  detail?: BrowserDetailState;
  pageStatus?: string;
  /** The parent item this level was opened from, shown as a breadcrumb. */
  title?: string;
};

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
    presentation === "friend-groups" ||
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
    presentation === "friend-groups" ||
    presentation === "members" ||
    presentation === "activities"
  );
}

const LABELS: Record<BrowserPresentation, string> = {
  "balance-users": "user balances",
  "friend-list": "friends",
  "group-list": "groups",
  "expense-list": "expenses",
  "friend-groups": "shared groups",
  members: "group members",
  activities: "activities",
};
/** Presentations whose body wraps its rows in `{items, hasMore, nextCursor}`. */
const PAGED = new Set<BrowserPresentation>([
  "group-list",
  "friend-list",
  "expense-list",
  "activities",
]);

function browserItems(presentation: BrowserPresentation, body: unknown) {
  return asArray(PAGED.has(presentation) ? asRecord(body).items : body).map(
    asRecord,
  );
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
    return display(item.user);
  }
  if (
    presentation === "group-list" ||
    presentation === "friend-groups" ||
    presentation === "members"
  ) {
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
  trail: string[] = [],
) {
  if (detail) {
    const links = detail.status === "loading" ? [] : (detail.links ?? []);
    return [
      `${ANSI.bold}${ANSI.yellow}BANANA${ANSI.reset}`,
      "",
      `◆ ${ANSI.bold}${detail.title}${ANSI.reset}`,
      `  ${ANSI.dim}esc/← back${links
        .map((link) => ` · ${link.key} ${link.label}`)
        .join("")} · q quit${ANSI.reset}`,
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
  const label = LABELS[presentation];
  const count = `${ANSI.green}${items.length}${
    normalizedQuery ? `/${allItems.length}` : ""
  }${ANSI.reset}`;
  const path = [...trail, label].join(" › ");
  const lines = [
    `${ANSI.bold}${ANSI.yellow}BANANA${ANSI.reset}`,
    "",
    `┌─ ${ANSI.yellow} ${path} ${ANSI.reset}`,
    "│",
    `◇ Found ${count} ${label}`,
    "│",
    `◆ ${ANSI.bold}Browse ${label}${ANSI.reset}`,
    `  Search: ${query}${ANSI.yellow}█${ANSI.reset}`,
    `  ${ANSI.dim}↑↓ move · type search · enter/→ details · esc/← ${
      trail.length ? "back" : "clear"
    } · q quit${ANSI.reset}`,
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
  } else if (PAGED.has(presentation) && response.hasMore) {
    lines.push(
      "",
      `${ANSI.dim}${
        presentation === "expense-list" || presentation === "activities"
          ? `Reach the last item to load more ${label} (↓ to continue).`
          : `More ${label} are available from the API.`
      }${ANSI.reset}`,
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
  nested?: BrowserNesting,
) {
  if (!hasInteractiveBrowser()) return false;

  const input = process.stdin;
  const output = process.stdout;
  const wasRaw = input.isRaw;
  const levels: BrowserStackLevel[] = [
    {
      presentation,
      body,
      loadDetail,
      loadPage,
      links: nested?.links,
      query: "",
      selectedIndex: 0,
    },
  ];
  let detailGeneration = 0;
  let finished = false;
  let loadingPage = false;

  emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  output.write("\x1b[?1049h\x1b[?25l");

  return await new Promise<boolean>((resolve) => {
    const current = () => levels[levels.length - 1];
    const draw = () => {
      if (finished) return;
      const level = current();
      output.write(
        `\x1b[H\x1b[2J${renderCollectionBrowser(
          level.presentation,
          level.body,
          level.query,
          level.selectedIndex,
          level.detail,
          output.rows,
          level.pageStatus,
          levels.slice(1).map((parent) => parent.title ?? ""),
        )}`,
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
    const failureMessage = (error: unknown) =>
      error instanceof CliFailure ? error.message : "Unexpected error";
    const openDetail = async (
      level: BrowserStackLevel,
      item: Record<string, unknown>,
    ) => {
      const generation = ++detailGeneration;
      const title = browserItemTitle(level.presentation, item);
      const links = nested?.open ? level.links?.(item) : undefined;
      level.detail = { status: "loading", title, links };
      draw();
      try {
        const value = await level.loadDetail(item);
        if (finished || generation !== detailGeneration) return;
        level.detail = { status: "loaded", title, value, links };
      } catch (error) {
        if (finished || generation !== detailGeneration) return;
        level.detail = {
          status: "error",
          title,
          links,
          message: failureMessage(error),
        };
      }
      draw();
    };
    const openLink = async (level: BrowserStackLevel, link: BrowserLink) => {
      const detail = level.detail;
      if (!nested?.open || !detail) return;
      const generation = ++detailGeneration;
      level.detail = { status: "loading", title: detail.title };
      draw();
      try {
        const opened = await nested.open(link);
        if (finished || generation !== detailGeneration) return;
        level.detail = detail;
        levels.push({
          ...opened,
          query: "",
          selectedIndex: 0,
          title: detail.title,
        });
      } catch (error) {
        if (finished || generation !== detailGeneration) return;
        level.detail = {
          status: "error",
          title: detail.title,
          links: detail.links,
          message: failureMessage(error),
        };
      }
      draw();
    };
    const loadNextPage = async (level: BrowserStackLevel) => {
      const response = asRecord(level.body);
      const cursor = response.nextCursor;
      if (finished || loadingPage || !level.loadPage || !response.hasMore ||
          typeof cursor !== "string" || !cursor) return;
      const label = LABELS[level.presentation];
      loadingPage = true;
      level.pageStatus = `Loading more ${label}…`;
      draw();
      try {
        const page = asRecord(await level.loadPage(cursor));
        if (finished) return;
        if (page.hasMore && page.nextCursor === cursor) {
          throw new CliFailure("api", `Pagination of ${label} did not advance`);
        }
        level.body = {
          ...page,
          items: [...asArray(response.items), ...asArray(page.items)],
        };
        level.pageStatus = undefined;
      } catch (error) {
        if (finished) return;
        level.pageStatus = `Unable to load more ${label}: ${failureMessage(
          error,
        )}. Press ↓ to retry.`;
      } finally {
        loadingPage = false;
      }
      draw();
    };
    const onKeypress = (
      text: string,
      key: { ctrl?: boolean; meta?: boolean; name?: string },
    ) => {
      const level = current();
      const itemCount = filterBrowserItems(
        level.presentation,
        level.body,
        level.query,
      ).length;
      if ((key.ctrl && key.name === "c") || key.name === "q") {
        finish();
        return;
      }
      const detail = level.detail;
      if (detail) {
        if (key.name === "escape" || key.name === "left") {
          detailGeneration++;
          level.detail = undefined;
          draw();
          return;
        }
        const link = (detail.status === "loading" ? [] : (detail.links ?? []))
          .find((candidate) => candidate.key === key.name);
        if (link) void openLink(level, link);
        return;
      }
      if (key.name === "escape" || key.name === "left") {
        if (level.query) {
          level.query = "";
          level.selectedIndex = 0;
        } else if (levels.length > 1) {
          detailGeneration++;
          levels.pop();
        } else {
          level.selectedIndex = 0;
        }
      } else if (key.name === "up") {
        level.selectedIndex = Math.max(0, level.selectedIndex - 1);
      } else if (key.name === "down") {
        level.selectedIndex = Math.min(
          Math.max(itemCount - 1, 0),
          level.selectedIndex + 1,
        );
        if (level.selectedIndex >= itemCount - 1) void loadNextPage(level);
      } else if (key.name === "backspace" || key.name === "delete") {
        level.query = level.query.slice(0, -1);
        level.selectedIndex = 0;
      } else if (key.name === "return" || key.name === "enter" || key.name === "right") {
        const items = filterBrowserItems(
          level.presentation,
          level.body,
          level.query,
        );
        const selected = items[Math.min(level.selectedIndex, items.length - 1)];
        if (selected) void openDetail(level, selected);
        return;
      } else if (
        text &&
        !key.ctrl &&
        !key.meta &&
        text >= " " &&
        text !== "\x7f"
      ) {
        level.query += text;
        level.selectedIndex = 0;
      }
      draw();
    };

    input.on("keypress", onKeypress);
    process.on("SIGWINCH", draw);
    draw();
  });
}
