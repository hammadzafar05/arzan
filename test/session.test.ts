import { describe, expect, it } from "vitest";
import { ServerError } from "../src/lib/server-error";
import { API_RETURNED_HTML, toSession } from "../src/lib/session";

describe("toSession (guards the session response)", () => {
  it("keeps a real session", () => {
    const s = { user: { id: "u1", name: "Ada" }, session: { id: "s1" } };
    expect(toSession(s)).toBe(s);
  });

  it("treats empty or malformed responses as signed out", () => {
    expect(toSession(null)).toBeNull();
    expect(toSession(undefined)).toBeNull();
    expect(toSession({})).toBeNull();
    expect(toSession({ session: { id: "s1" } })).toBeNull();
    expect(toSession({ user: { id: "u1" } })).toBeNull();
    expect(toSession({ user: "Ada", session: { id: "s1" } })).toBeNull();
  });

  it("explains when the API answered with a web page instead of data", () => {
    const html = "<!doctype html><html><body><div id=root></div></body></html>";
    expect(() => toSession(html)).toThrow(ServerError);
    expect(() => toSession(html)).toThrow(API_RETURNED_HTML);
  });
});
