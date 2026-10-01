// Production System Authentication & Session Utilities
// Uses standard Web Crypto API (supported in Node.js & Next.js Edge Middleware)

export const SESSION_COOKIE_NAME = "radhe_prod_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Default credentials - can be overridden via environment variables
export const AUTH_CREDENTIALS = {
  // Allow email, company name, or admin as valid login identifiers
  validUsernames: [
    (process.env.AUTH_USERNAME || "admin@radhevastraz.com").toLowerCase(),
    "admin@radhevastraz.com",
    "radhevastraz",
    "admin",
  ],
  password: process.env.AUTH_PASSWORD || "RadheProduction@2026#",
};

const SECRET_KEY =
  process.env.AUTH_SECRET ||
  "7f8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b";

// Helper: Convert string to Uint8Array
function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper: Base64URL encode
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: Base64URL decode
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Helper: Get CryptoKey for HMAC
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    strToUint8(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface SessionPayload {
  username: string;
  name: string;
  role: string;
  exp: number; // unix timestamp in seconds
}

/**
 * Sign a session payload into an HMAC-SHA256 signed JWT-style token
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  expiresInSeconds = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: SessionPayload = { ...payload, exp };

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${header}.${body}`;

  const key = await getCryptoKey(SECRET_KEY);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    strToUint8(dataToSign) as unknown as BufferSource
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = "";
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  const signature = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${dataToSign}.${signature}`;
}

/**
 * Verify a session token and return its payload, or null if invalid/expired
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const dataToVerify = `${header}.${body}`;

    const key = await getCryptoKey(SECRET_KEY);

    // Decode signature
    const sigStr = signature.replace(/-/g, "+").replace(/_/g, "/");
    let paddedSig = sigStr;
    while (paddedSig.length % 4) paddedSig += "=";
    const sigBinary = atob(paddedSig);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      strToUint8(dataToVerify) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export function setAuthPassword(newPassword: string): void {
  AUTH_CREDENTIALS.password = newPassword;
  process.env.AUTH_PASSWORD = newPassword;
}

/**
 * Check if given credentials match the system's authorized user
 */
export function validateCredentials(usernameInput: string, passwordInput: string): boolean {
  if (!usernameInput || !passwordInput) return false;

  const normalizedUser = usernameInput.trim().toLowerCase();
  const isUserValid = AUTH_CREDENTIALS.validUsernames.includes(normalizedUser);
  const activePassword = process.env.AUTH_PASSWORD || AUTH_CREDENTIALS.password;
  const isPasswordValid = passwordInput === activePassword;

  return isUserValid && isPasswordValid;
}
