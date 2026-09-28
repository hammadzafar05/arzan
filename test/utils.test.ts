import { describe, expect, it } from "vitest";
import { initials, safeRedirect } from "../src/lib/utils";

describe("safeRedirect (open-redirect guard)", () => {
  it("keeps same-site paths, query and hash", () => {
    expect(safeRedirect("/settings/password")).toBe("/settings/password");
    expect(safeRedirect("/things?page=2#top")).toBe("/things?page=2#top");
  });

  it.each([
    ["absolute URL", "https://evil.com"],
    ["protocol-relative", "//evil.com"],
    ["backslash trick", "/\\evil.com"],
    ["backslash later in path", "/foo\\..\\\\evil.com"],
    ["javascript: URL", "javascript:alert(1)"],
    ["tab inside scheme", "/\t/evil.com"],
    ["newline", "/ok\n//evil.com"],
    ["relative path", "dashboard"],
    ["empty", ""],
    ["not a string", 42],
    ["undefined", undefined],
    ["huge", `/${"a".repeat(3000)}`],
  ])("rejects %s", (_label, value) => {
    expect(safeRedirect(value)).toBe("/dashboard");
  });

  it("uses the given fallback", () => {
    expect(safeRedirect("//evil.com", "/")).toBe("/");
  });
});

describe("initials", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["grace", "G"],
    ["  Alan  Mathison   Turing ", "AT"],
    ["", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
