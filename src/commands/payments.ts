import {
  asRecord,
  cleanUserSummary,
  display,
  humanAmount,
  humanDate,
  isoDate,
  numeric,
  parseJsonBody,
  parseOptions,
  requiredString,
  requirePositionals,
  usageFailure,
  wantsHelp,
  yesNo,
} from "../shared";
import { helpText } from "../help";
import { fields, heading, note, section, table } from "../render";
import { type ParsedCommand, type Presenter } from "../types";

const ADD_HELP = helpText({
  summary: "Record a payment that settles part of a balance.",
  usage: [
    "banana payments add --amount AMOUNT --currency-id ID --from-user-id ID",
    "                    --to-user-id ID --date DATE [flags]",
    "banana payments add JSON",
  ],
  options: [
    ["--amount AMOUNT", "Amount paid (required)"],
    ["--currency-id ID", "Currency of the amount (required)"],
    ["--from-user-id ID", "User who paid (required)"],
    ["--to-user-id ID", "User who was paid (required)"],
    ["--date DATE", "YYYY-MM-DD or DD-MM-YYYY (required)"],
    ["--group-id ID", "Settle inside a group"],
    ["--description TEXT", "Longer note"],
  ],
  examples: [
    "banana payments add --amount 20 --currency-id <currency-id> \\",
    "  --from-user-id <user-id> --to-user-id <user-id> --date 2026-09-09",
  ],
});
const HELP = helpText({
  summary: "Record and inspect payments between you and the people you split with.",
  usage: ["banana payments <command> [flags]"],
  commands: [
    ["add", "Record a payment"],
    ["get <payment-id>", "Show one payment"],
  ],
  examples: [
    "banana payments get <payment-id>",
    "banana payments add --amount 20 --currency-id <currency-id> \\",
    "  --from-user-id <user-id> --to-user-id <user-id> --date 2026-09-09",
  ],
  learnMore: ["banana payments <command> --help"],
});
const GET_HELP = helpText({
  summary: "Show one payment: who paid whom, how much, and when.",
  usage: ["banana payments get <payment-id>"],
  examples: [
    "banana payments get <payment-id>",
    "banana payments get <payment-id> --json",
  ],
});

export function parsePayments(args: string[]): ParsedCommand {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  const [command, ...rest] = args;
  if (command === "get") {
    if (wantsHelp(rest)) return { kind: "help", text: GET_HELP };
    const { positionals } = parseOptions(rest, {}, GET_HELP);
    requirePositionals(positionals, 1, GET_HELP);
    return {
      kind: "request",
      path: `/payments/${encodeURIComponent(positionals[0])}`,
      presentation: "payment",
    };
  }
  if (command !== "add") {
    throw usageFailure(`Unknown command: payments ${command}`, HELP);
  }
  if (wantsHelp(rest)) return { kind: "help", text: ADD_HELP };

  const { positionals, values } = parseOptions(
    rest,
    {
      amount: { type: "string" },
      "currency-id": { type: "string" },
      date: { type: "string" },
      description: { type: "string" },
      "from-user-id": { type: "string" },
      "group-id": { type: "string" },
      "to-user-id": { type: "string" },
    },
    ADD_HELP,
  );
  const jsonBody = parseJsonBody(positionals, values, ADD_HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/payments",
      presentation: "payment-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, ADD_HELP);

  const groupId = values["group-id"] as string | undefined;
  const description = values.description as string | undefined;
  return {
    kind: "request",
    method: "POST",
    path: "/payments",
    presentation: "payment-created",
    body: {
      amount: requiredString(values.amount, "--amount", ADD_HELP),
      currencyId: requiredString(
        values["currency-id"],
        "--currency-id",
        ADD_HELP,
      ),
      fromUserId: requiredString(
        values["from-user-id"],
        "--from-user-id",
        ADD_HELP,
      ),
      toUserId: requiredString(values["to-user-id"], "--to-user-id", ADD_HELP),
      date: isoDate(values.date, ADD_HELP),
      ...(groupId === undefined ? {} : { groupId }),
      ...(description === undefined ? {} : { description }),
    },
  };
}

function cleanPayment(body: unknown) {
  const payment = asRecord(body);
  return {
    id: payment.id ?? null,
    description: payment.description ?? null,
    amount: numeric(payment.amount),
    currency: asRecord(payment.currency).code ?? payment.currencyId ?? null,
    from: cleanUserSummary(payment.fromUser),
    to: cleanUserSummary(payment.toUser),
    group: payment.groupId
      ? {
          id: payment.groupId,
          name: asRecord(payment.group).name ?? null,
        }
      : null,
    date: payment.date ?? null,
    isSettlement: payment.isSettlement === true,
    createdAt: payment.createdAt ?? null,
  };
}

function cleanCreatedPaymentItem(value: unknown) {
  const payment = asRecord(value);
  return {
    id: payment.id ?? null,
    description: payment.description ?? null,
    amount: numeric(payment.amount),
    currencyId: payment.currencyId ?? null,
    fromUserId: payment.fromUserId ?? null,
    toUserId: payment.toUserId ?? null,
    groupId: payment.groupId ?? null,
    date: payment.date ?? null,
    timezone: payment.timezone ?? null,
    isSettlement: payment.isSettlement === true,
    usedOptimalSettlement: payment.usedOptimalSettlement === true,
  };
}

export const paymentPresenters = {
  payment: {
    clean: cleanPayment,
    format(body) {
      const response = asRecord(body);
      const group = asRecord(response.group);
      const from = asRecord(response.from);
      const to = asRecord(response.to);
      return section(
        heading("Payment"),
        fields([
          ["Amount", humanAmount(response.amount, response.currency)],
          ["From", display(from.name)],
          ["To", display(to.name)],
          ["Group", response.group ? display(group.name) : "—"],
          ["Description", display(response.description)],
          ["Date", humanDate(response.date)],
          ["Settlement", yesNo(response.isSettlement)],
          ["ID", display(response.id), true],
          ["From ID", display(from.id), true],
          ["To ID", display(to.id), true],
          ["Group ID", response.group ? display(group.id) : "—", true],
        ]),
      );
    },
  },
  "payment-created": {
    clean(body) {
      return Array.isArray(body)
        ? body.map(cleanCreatedPaymentItem)
        : cleanCreatedPaymentItem(body);
    },
    format(body) {
      const payments = Array.isArray(body) ? body : [body];
      return section(
        heading(
          payments.length === 1
            ? "Payment created"
            : `${payments.length} payments created`,
        ),
        table(
          [
            { label: "ID", id: true },
            { label: "Date" },
            { label: "From", id: true },
            { label: "To", id: true },
            { label: "Amount", align: "right" },
          ],
          payments.map((value) => {
            const payment = asRecord(value);
            return [
              payment.id,
              humanDate(payment.date),
              payment.fromUserId,
              payment.toUserId,
              humanAmount(payment.amount, payment.currencyId),
            ];
          }),
        ),
      );
    },
  },
} satisfies Record<"payment" | "payment-created", Presenter>;
