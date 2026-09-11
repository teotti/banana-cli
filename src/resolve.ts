import type { AuthRuntime } from "./auth";
import { request } from "./request";
import { asArray, asRecord, usageFailure } from "./shared";
import type { Environment, Reference, ReferenceKind } from "./types";

/** An id is passed through untouched; anything else is a name to look up. */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How many rows a narrowed lookup keeps; a name that needs more is ambiguous. */
const LOOKUP_LIMIT = "25";
/** How many rows the fallback sweep fetches when a search finds nothing. */
const SWEEP_LIMIT = "100";

type Candidate = {
  id: string;
  /** Everything this row answers to, lowercased. */
  labels: string[];
  name: string;
};

function candidate(id: unknown, name: unknown, ...aliases: unknown[]) {
  if (typeof id !== "string" || !id) return undefined;
  const labels = [name, ...aliases]
    .filter((value): value is string => typeof value === "string" && !!value)
    .map((value) => value.toLowerCase());
  return { id, labels, name: typeof name === "string" ? name : id };
}

function collect(values: (Candidate | undefined)[]) {
  const seen = new Set<string>();
  return values.filter((value): value is Candidate => {
    if (!value || seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}

const HINTS: Record<ReferenceKind, string> = {
  currency: "banana currencies --search",
  group: "banana groups --search",
  user: "banana friends --search",
};

/**
 * Exact match first, then prefix, then substring — so `--group Amália` wins
 * outright over `Amália 26` when both exist, and a short prefix still works
 * when it doesn't. Nothing matched is not an error here: the caller widens the
 * search before giving up.
 */
function pick(candidates: Candidate[], reference: Reference, value: string) {
  const wanted = value.trim().toLowerCase();
  const rounds = [
    (label: string) => label === wanted,
    (label: string) => label.startsWith(wanted),
    (label: string) => label.includes(wanted),
  ];
  for (const matches of rounds) {
    const found = candidates.filter((entry) => entry.labels.some(matches));
    if (found.length === 1) return found[0]!.id;
    if (found.length > 1) {
      throw usageFailure(
        `${reference.flag} ${JSON.stringify(value)} matches ${found.length} ${
          reference.kind
        }s: ${found
          .slice(0, 5)
          .map((entry) => entry.name)
          .join(", ")}. Use a longer name or the id.`,
      );
    }
  }
  return undefined;
}

/**
 * One run's lookups. `/groups` and `/friends` search on `q`, so a name is
 * asked for by name; `/currencies` has no filter, so its one list is fetched
 * whole. Every distinct query is fetched at most once per run.
 */
function lookups(runtime: AuthRuntime, env: Environment) {
  const get = async (path: string, query?: URLSearchParams) =>
    await request(
      { kind: "request", path, presentation: "user", query },
      runtime,
      env,
    );
  const cache = new Map<string, Promise<Candidate[]>>();
  const once = (key: string, load: () => Promise<Candidate[]>) => {
    const pending = cache.get(key) ?? load();
    cache.set(key, pending);
    return pending;
  };
  const page = (search: string | undefined) =>
    new URLSearchParams(
      search === undefined
        ? { l: SWEEP_LIMIT }
        : { q: search, l: LOOKUP_LIMIT },
    );

  const lists: Record<
    ReferenceKind,
    (search: string | undefined) => Promise<Candidate[]>
  > = {
    // The currency list takes no query parameters, so it is fetched whole and
    // the same list answers every currency name in the run.
    currency: () =>
      once("currency", async () =>
        collect(
          asArray(await get("/currencies")).map((value) => {
            const currency = asRecord(value);
            return candidate(currency.id, currency.code, currency.name);
          }),
        ),
      ),
    group: (search) =>
      once(`group:${search ?? ""}`, async () =>
        collect(
          asArray(asRecord(await get("/groups", page(search))).items).map(
            (value) => {
              const group = asRecord(value);
              return candidate(group.id, group.name);
            },
          ),
        ),
      ),
    // A user can be named as a friend or as yourself; `me` is always you.
    user: (search) =>
      once(`user:${search ?? ""}`, async () => {
        const [me, friends] = await Promise.all([
          currentUser(),
          get("/friends", page(search)),
        ]);
        return collect([
          candidate(me.id, me.name, "me", me.username, me.email),
          ...asArray(asRecord(friends).items).map((value) => {
            const user = asRecord(asRecord(value).user);
            return candidate(user.id, user.name, user.username, user.email);
          }),
        ]);
      }),
  };

  let me: Promise<Record<string, unknown>> | undefined;
  function currentUser() {
    me ??= get("/current-user").then(asRecord);
    return me;
  }

  return { lists, currentUser };
}

/** Sets `splits.0.userId`-style paths, so a split names a person too. */
function assign(body: unknown, field: string, id: string) {
  const path = field.split(".");
  const last = path.pop()!;
  let target: Record<string, unknown> = asRecord(body);
  for (const step of path) {
    const next = (target as Record<string, unknown>)[step];
    target = (Array.isArray(next) ? next : asRecord(next)) as Record<
      string,
      unknown
    >;
  }
  target[last] = id;
}

/**
 * Turns the names on a write command into ids before it is sent. Each kind of
 * lookup is fetched at most once per run, and an id needs no lookup at all —
 * so `--paid-by <uuid>` still costs nothing.
 */
export async function resolveReferences(
  references: Reference[],
  body: unknown,
  path: string,
  runtime: AuthRuntime,
  env: Environment,
) {
  const { lists, currentUser } = lookups(runtime, env);
  let resolvedPath = path;

  // One name asks the API for that name; several names of the same kind —
  // `--split Ana=20 --split Bruno=10` — are cheaper as one page matched here
  // than as one request each.
  const names = new Map<ReferenceKind, Set<string>>();
  for (const reference of references) {
    if (reference.value === undefined || UUID.test(reference.value)) continue;
    const seen = names.get(reference.kind) ?? new Set<string>();
    names.set(reference.kind, seen.add(reference.value.toLowerCase()));
  }

  for (const reference of references) {
    let id: string | undefined;
    if (reference.value === undefined) {
      // Only a user reference defaults, and it defaults to whoever is signed in.
      const me = await currentUser();
      if (typeof me.id !== "string") {
        throw usageFailure(`${reference.flag} is required`);
      }
      id = me.id;
    } else if (UUID.test(reference.value)) {
      id = reference.value;
    } else {
      const value = reference.value;
      const search =
        (names.get(reference.kind)?.size ?? 0) > 1 ? undefined : value;
      id = pick(await lists[reference.kind](search), reference, value);
      if (id === undefined && search !== undefined) {
        // The server's search and this one disagree — a username, an email, a
        // middle-of-the-name match. Sweep a wide page before giving up.
        id = pick(await lists[reference.kind](undefined), reference, value);
      }
      if (id === undefined) {
        throw usageFailure(
          `No ${reference.kind} matches ${JSON.stringify(value)}. Find it with ${
            HINTS[reference.kind]
          } ${JSON.stringify(value)}.`,
        );
      }
    }

    if (reference.field === "path") {
      resolvedPath = resolvedPath.replace(":ref", encodeURIComponent(id));
    } else {
      assign(body, reference.field, id);
    }
  }
  return resolvedPath;
}
