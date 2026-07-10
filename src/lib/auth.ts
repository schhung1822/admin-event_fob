export const AUTH_COOKIE_NAME = "crm_fob_session";

type SessionPayload = {
  exp: number;
  id: number;
  role?: string;
  username: string;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.DB_PASSWORD || "crm-fob-session-secret";
}

function toBase64Url(input: string | Uint8Array) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const padded = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">, maxAgeSeconds: number) {
  const value = toBase64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    }),
  );

  return `${value}.${await sign(value)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;

  const [value, signature] = token.split(".");
  if (!value || !signature) return null;

  const expected = await sign(value);
  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(fromBase64Url(value)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
