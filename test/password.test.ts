import { describe, expect, it } from "vitest";
import { hashPassword, PBKDF2_ITERATIONS, verifyPassword } from "../worker/auth/password";

describe("password hashing", () => {
  it("stores algorithm, iterations and salt with the hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(new RegExp(`^pbkdf2-sha256\\$${PBKDF2_ITERATIONS}\\$[0-9a-f]{32}\\$[0-9a-f]{64}$`));
  });

  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword({ hash, password: "correct horse battery staple" })).toBe(true);
    expect(await verifyPassword({ hash, password: "Correct horse battery staple" })).toBe(false);
    expect(await verifyPassword({ hash: "garbage", password: "x" })).toBe(false);
  });

  it("uses a new salt every time", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });
});
