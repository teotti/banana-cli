import {
  asRecord,
  cleanUserSummary,
  display,
  formatCard,
  humanAmount,
  isoDate,
  namedEntity,
  numeric,
  parseJsonBody,
  parseOptions,
  requiredString,
  requirePositionals,
  wantsHelp,
  yesNo,
} from "../shared";
import { CliFailure, type ParsedCommand, type Presenter } from "../types";

const HELP = `USAGE
  banana payments add JSON
  banana payments add --amount AMOUNT --currency-id ID
                      --from-user-id ID --to-user-id ID
                      --date YYYY-MM-DD|DD-MM-YYYY
                      [--group-id ID] [--description TEXT]
  banana payments get <payment-id>`;
const GET_HELP = `USAGE
  banana payments get <payment-id>`;

export function parsePayments(args: string[]): ParsedCommand {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { kind: "help", text: HELP };
  }
  const [command, ...rest] = args;
  if (command === "get") {
    if (wantsHelp(rest)) return { kind: "help", text: GET_HELP };
    const { positionals } = parseOptions(rest);
    requirePositionals(positionals, 1, GET_HELP);
    return {
      kind: "request",
      path: `/payments/${encodeURIComponent(positionals[0])}`,
      presentation: "payment",
    };
  }
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
      return [
        "Payment",
        `Amount: ${humanAmount(response.amount, response.currency)}`,
        `From: ${namedEntity(response.from)}`,
        `To: ${namedEntity(response.to)}`,
        `Group: ${response.group ? namedEntity(group) : "—"}`,
        `Description: ${display(response.description)}`,
        `Date: ${display(response.date)}`,
        `Settlement: ${yesNo(response.isSettlement)}`,
        `ID: ${display(response.id)}`,
      ].join("\n");
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
} satisfies Record<"payment" | "payment-created", Presenter>;
