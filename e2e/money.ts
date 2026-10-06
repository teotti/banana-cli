import { numeric } from "../src/shared";

/** Amounts are 18-decimal strings on the wire and numbers in `--json`. */
export function close(left: unknown, right: unknown) {
  const a = numeric(left);
  const b = numeric(right);
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-6;
}

export type BalanceSnapshot = {
  balance: number | null;
  totalOwed: number | null;
  totalOwing: number | null;
  users: Array<{ userId: string; balance: number | null }>;
};

export function balancesMatch(before: BalanceSnapshot, after: BalanceSnapshot) {
  const totals =
    close(before.balance, after.balance) &&
    close(before.totalOwed, after.totalOwed) &&
    close(before.totalOwing, after.totalOwing);
  if (!totals) return false;

  const ids = new Set([
    ...before.users.map((user) => user.userId),
    ...after.users.map((user) => user.userId),
  ]);
  for (const id of ids) {
    const left = before.users.find((user) => user.userId === id);
    const right = after.users.find((user) => user.userId === id);
    const leftValue = left?.balance ?? 0;
    const rightValue = right?.balance ?? 0;
    if (!close(leftValue, rightValue)) return false;
  }
  return true;
}
