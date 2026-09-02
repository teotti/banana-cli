import {
  asRecord,
  display,
  formatCard,
  humanAmount,
  isoDate,
  numeric,
  parseJsonBody,
  parseOptions,
  requiredString,
  requirePositionals,
  wantsHelp,
} from "../shared";
import { CliFailure, type ParsedCommand, type Presenter } from "../types";

const HELP = `Usage: banana payments add JSON
   or: banana payments add --amount AMOUNT --currency-id ID
                           --from-user-id ID --to-user-id ID
                           --date YYYY-MM-DD|DD-MM-YYYY
                           [--group-id ID] [--description TEXT]`;

export function parsePayments(args: string[]): ParsedCommand {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  const [command, ...rest] = args;
  if (command !== "add") throw new CliFailure("usage", HELP);
  if (wantsHelp(rest)) return { kind: "help", text: HELP };

  const { positionals, values } = parseOptions(rest, {
    amount: { type: "string" },
    "currency-id": { type: "string" },
    date: { type: "string" },
    description: { type: "string" },
    "from-user-id": { type: "string" },
    "group-id": { type: "string" },
    "to-user-id": { type: "string" },
  });
  const jsonBody = parseJsonBody(positionals, values, HELP);
  if (jsonBody !== undefined) {
    return {
      kind: "request",
      method: "POST",
      path: "/payments",
      presentation: "payment-created",
      body: jsonBody,
    };
  }
  requirePositionals(positionals, 0, HELP);

  const groupId = values["group-id"] as string | undefined;
  const description = values.description as string | undefined;
  return {
    kind: "request",
    method: "POST",
    path: "/payments",
    presentation: "payment-created",
    body: {
      amount: requiredString(values.amount, "--amount", HELP),
      currencyId: requiredString(values["currency-id"], "--currency-id", HELP),
      fromUserId: requiredString(values["from-user-id"], "--from-user-id", HELP),
      toUserId: requiredString(values["to-user-id"], "--to-user-id", HELP),
      date: isoDate(values.date, HELP),
      ...(groupId === undefined ? {} : { groupId }),
      ...(description === undefined ? {} : { description }),
    },
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
  "payment-created": {
    clean(body) {
      return Array.isArray(body)
        ? body.map(cleanCreatedPaymentItem)
        : cleanCreatedPaymentItem(body);
    },
    format(body) {
      const payments = Array.isArray(body) ? body : [body];
      return [
        payments.length === 1
          ? "Payment created"
          : `${payments.length} payments created`,
        ...payments.map((value, index) => {
          const payment = asRecord(value);
          return formatCard(index, payment.id, [
            `Amount: ${humanAmount(payment.amount, payment.currencyId)}`,
            `From: ${display(payment.fromUserId)}`,
            `To: ${display(payment.toUserId)}`,
            `Group ID: ${display(payment.groupId)}`,
            `Date: ${display(payment.date)}`,
          ]);
        }),
      ].join("\n\n");
    },
  },
} satisfies Record<"payment-created", Presenter>;
