const SECRET_KEY =
  /^(?:access_?token|refresh_?token|device_?code|authorization|password|secret)$/i;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/-]+=*/g;

/** Reports and error text must not keep credentials that a command happened to print. */
export function redact(value: unknown, secrets: string[] = [], key?: string): unknown {
  if (key && SECRET_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") {
    let text = secrets.reduce(
      (current, secret) =>
        secret.length > 0 ? current.replaceAll(secret, "[redacted]") : current,
      value,
    );
    text = text.replace(BEARER, "Bearer [redacted]");
    return text;
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, secrets));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, secrets, entryKey),
      ]),
    );
  }
  return value;
}
