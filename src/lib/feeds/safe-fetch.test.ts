import { describe, it, expect } from "vitest";
import { isPrivateIp } from "./safe-fetch";

describe("isPrivateIp — IPv4", () => {
  it("flags loopback, private, link-local, CGNAT, multicast", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.5",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "100.64.0.1",
      "224.0.0.1",
      "0.0.0.0",
    ]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "192.169.0.1", "100.63.255.255"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });
});

describe("isPrivateIp — IPv6", () => {
  it("flags loopback, unspecified, link-local, ULA, mapped-private", () => {
    for (const ip of ["::1", "::", "fe80::1", "fc00::1", "fd12::3", "::ffff:127.0.0.1", "::ffff:10.0.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("allows public v6 and mapped-public", () => {
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("isPrivateIp — non-IP", () => {
  it("returns false for hostnames (resolution handled separately)", () => {
    expect(isPrivateIp("example.com")).toBe(false);
    expect(isPrivateIp("not-an-ip")).toBe(false);
  });
});
