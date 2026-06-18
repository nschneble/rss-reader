import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { parseIntParam, route, requireId, bad, ApiError } from "./http";

const req = () => new NextRequest("http://localhost/");

describe("parseIntParam", () => {
  it("parses valid integers including negatives", () => {
    expect(parseIntParam("5")).toBe(5);
    expect(parseIntParam("-3")).toBe(-3);
  });
  it("returns null for absent/empty/non-integer", () => {
    expect(parseIntParam(null)).toBeNull();
    expect(parseIntParam("")).toBeNull();
    expect(parseIntParam("1.5")).toBeNull();
    expect(parseIntParam("abc")).toBeNull();
  });
});

describe("bad", () => {
  it("throws an ApiError with the given status", () => {
    expect(() => bad("nope", 404)).toThrowError(ApiError);
    try {
      bad("nope", 404);
    } catch (e) {
      expect((e as ApiError).status).toBe(404);
    }
  });
});

describe("route wrapper", () => {
  it("maps a thrown ApiError to its status and message", async () => {
    const handler = route(async () => bad("teapot", 418));
    const res = await handler(req(), undefined);
    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ error: "teapot" });
  });

  it("maps an unexpected throw to 500", async () => {
    const handler = route(async () => {
      throw new Error("boom");
    });
    const res = await handler(req(), undefined);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("requireId", () => {
  it("resolves a valid integer param", async () => {
    await expect(requireId({ params: Promise.resolve({ id: "7" }) })).resolves.toBe(7);
  });
  it("throws 400 for a non-integer param", async () => {
    await expect(
      requireId({ params: Promise.resolve({ id: "x" }) }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
