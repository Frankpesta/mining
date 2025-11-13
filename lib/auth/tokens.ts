import crypto from "crypto";

export function generateRandomToken(length = 48) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

export function generateNumericCode(digits = 6) {
  const max = 10 ** digits;
  const code = crypto.randomInt(0, max);
  return code.toString().padStart(digits, "0");
}

export function createTokenExpiry(minutes: number) {
  return Date.now() + minutes * 60 * 1000;
}

