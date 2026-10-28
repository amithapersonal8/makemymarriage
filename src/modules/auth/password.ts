import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Memory-hard scrypt: N=2^17, r=8, p=1 (128 MiB); no native addon needed.
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt:131072:8:1:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string | undefined,
) {
  // Unknown accounts still perform the same costly derivation to avoid a fast lookup path.
  const fallback = `scrypt:131072:8:1:${"0".repeat(32)}:${"0".repeat(128)}`;
  const encoded = storedHash ?? fallback;
  const match = /^scrypt:131072:8:1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(
    encoded,
  );
  if (!match?.[1] || !match[2]) return false;
  const key = await derive(password, match[1]);
  return (
    timingSafeEqual(key, Buffer.from(match[2], "hex")) &&
    storedHash !== undefined
  );
}
