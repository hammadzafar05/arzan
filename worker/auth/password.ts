/**
 * Password hashing that fits the Workers Free plan's 10 ms CPU limit.
 *
 * Better Auth's default on Workers is pure-JS scrypt (~150 ms of CPU per hash), which can
 * make sign-ups fail with "exceeded CPU limit". WebCrypto PBKDF2 runs natively (~20 ms)
 * and is proven on Free-plan production apps.
 *
 * Format: pbkdf2-sha256$<iterations>$<salt hex>$<hash hex>. The iteration count is stored
 * with each hash, so it can be raised later without breaking existing passwords.
 */
export const PBKDF2_ITERATIONS = 100_000; // the maximum Workers allows

const encoder = new TextEncoder();
const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (s: string) => new Uint8Array((s.match(/../g) ?? []).map((h) => Number.parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password.normalize("NFKC")), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [alg, iterations, salt, expected] = hash.split("$");
  if (alg !== "pbkdf2-sha256" || !iterations || !salt || !expected) return false;
  const actual = await derive(password, fromHex(salt), Number(iterations));
  const want = fromHex(expected);
  if (actual.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ want[i]!;
  return diff === 0;
}
