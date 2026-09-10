import {
  asArray,
  asRecord,
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
  userRef,
  wantsHelp,
  yesNo,
} from "../shared";
import { helpText } from "../help";
import { fields, heading, section, table } from "../render";
import { type ParsedCommand, type Presenter } from "../types";

const ADD_HELP = helpText({
  summary: "Record a payment that settles part of a balance.",
  usage: [
    "banana payments add --amount AMOUNT --currency CODE --from WHO",
    "                    --to WHO --date DATE [flags]",
    "banana payments add JSON",
  ],
  options: [
    ["--amount AMOUNT", "Amount paid (required)"],
    ["--currency CODE", "Currency of the amount (required)"],
    ["--from WHO", "Who paid (required)"],
    ["--to WHO", "Who was paid (required)"],
    ["--date DATE", "YYYY-MM-DD or DD-MM-YYYY (required)"],
    ["--group NAME", "Settle inside a group"],
    ["--description TEXT", "Longer note"],
  ],
  notes: [
    "--currency, --group, --from and --to take a code, a name or a prefix\nof one, as well as an id. `--from me` is you.",
    "Both sides are named on purpose: a payment cannot be deleted from the\nCLI, so the direction is never guessed.",
  ],
  examples: [
    "banana payments add --amount 20 --currency EUR \\",
    "  --from me --to Ana --date 2026-09-09",
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
    "banana payments add --amount 20 --currency EUR \\",
    "  --from me --to Ana --date 2026-09-09",
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
      currency: { type: "string" },
      date: { type: "string" },
      description: { type: "string" },
      from: { type: "string" },
      group: { type: "string" },
      to: { type: "string" },
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

  const group = values.group as string | undefined;
  const description = values.description as string | undefined;
  return {
    kind: "request",
    method: "POST",
    path: "/payments",
    presentation: "payment-created",
    body: {
      amount: requiredString(values.amount, "--amount", ADD_HELP),
      date: isoDate(values.date, ADD_HELP),
      ...(description === undefined ? {} : { description }),
    },
    references: [
      {
        field: "currencyId",
        flag: "--currency",
        kind: "currency",
        value: requiredString(values.currency, "--currency", ADD_HELP),
      },
      {
        field: "fromUserId",
        flag: "--from",
        kind: "user",
        value: requiredString(values.from, "--from", ADD_HELP),
      },
      {
        field: "toUserId",
        flag: "--to",
        kind: "user",
        value: requiredString(values.to, "--to", ADD_HELP),
      },
      ...(group === undefined
        ? []
        : [
            {
              field: "groupId",
              flag: "--group",
              kind: "group" as const,
              value: group,
            },
          ]),
    ],
  };
}

function cleanPayment(body: unknown) {
  const payment = asRecord(body);
  return {
    id: payment.id ?? null,
    description: payment.description ?? null,
    amount: numeric(payment.amount),
    currencyId: payment.currencyId ?? null,
    currency: asRecord(payment.currency).code ?? null,
    ...userRef("fromUserId", "from", payment.fromUser),
    ...userRef("toUserId", "to", payment.toUser),
    groupId: payment.groupId ?? null,
    group: asRecord(payment.group).name ?? null,
    date: payment.date ?? null,
    isSettlement: payment.isSettlement === true,
    createdAt: payment.createdAt ?? null,
  };
}

function formatPayment(body: unknown, title: string) {
  const response = asRecord(body);
  return section(
    heading(title),
    fields([
      ["Amount", humanAmount(response.amount, response.currency)],
      ["From", display(response.from)],
      ["To", display(response.to)],
      ["Group", display(response.group)],
      ["Description", display(response.description)],
      ["Date", humanDate(response.date)],
      ["Settlement", yesNo(response.isSettlement)],
      ["ID", display(response.id), true],
    ]),
  );
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
    format: (body) => formatPayment(body, "Payment"),
  },
  // A single payment is read back in full, so it prints codes and names.
  "payment-created": {
    clean: cleanPayment,
    format: (body) => formatPayment(body, "Payment created"),
  },
  // An optimal settlement answers with several rows at once, which are only
  // ever the flat write shape.
  "payments-created": {
    clean: (body) => asArray(body).map(cleanCreatedPaymentItem),
    format(body) {
      const payments = asArray(body);
      return section(
        heading(`${payments.length} payments created`),
        table(
          [
            { label: "ID", id: true },
            { label: "Date" },
            { label: "Amount", align: "right" },
          ],
          payments.map((value) => {
            const payment = asRecord(value);
            return [
              payment.id,
              humanDate(payment.date),
              humanAmount(payment.amount, payment.currencyId),
            ];
          }),
        ),
      );
    },
  },
} satisfies Record<"payment" | "payment-created" | "payments-created", Presenter>;
