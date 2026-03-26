import { describe, it, expect, beforeEach } from "vitest";
import { ProxyAgent } from "undici";
import { resolveProxyUrl, createProxyDispatcher, createFetchOptions } from "../src/utils";
import { resetConfig, resolveConfig } from "../src/config";

describe("resolveProxyUrl", () => {
  it("resolves string proxy URL", () => {
    expect(resolveProxyUrl("http://proxy:8080")).toBe("http://proxy:8080");
  });

  it("resolves object proxy URL", () => {
    expect(resolveProxyUrl({ url: "http://proxy:8080" })).toBe("http://proxy:8080");
  });

  it("resolves rotate function", () => {
    let i = 0;
    const rotate = () => `http://proxy${i++}:8080`;
    expect(resolveProxyUrl({ rotate })).toBe("http://proxy0:8080");
    expect(resolveProxyUrl({ rotate })).toBe("http://proxy1:8080");
  });

  it("returns undefined for undefined", () => {
    expect(resolveProxyUrl(undefined)).toBeUndefined();
  });

  it("returns undefined for false", () => {
    expect(resolveProxyUrl(false)).toBeUndefined();
  });
});

describe("createProxyDispatcher", () => {
  it("returns a ProxyAgent instance", () => {
    const dispatcher = createProxyDispatcher("http://proxy:8080");
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });

  it("returns the same instance for the same proxy URL", () => {
    const a = createProxyDispatcher("http://cached-proxy:9090");
    const b = createProxyDispatcher("http://cached-proxy:9090");
    expect(a).toBe(b);
  });

  it("returns different instances for different proxy URLs", () => {
    const a = createProxyDispatcher("http://proxy-a:8080");
    const b = createProxyDispatcher("http://proxy-b:8080");
    expect(a).not.toBe(b);
  });
});

describe("createFetchOptions proxy injection", () => {
  beforeEach(() => {
    resetConfig();
  });

  it("injects dispatcher when proxy option is provided", async () => {
    const opts = await createFetchOptions(
      "https://example.com",
      {},
      {
        proxy: "http://proxy:8080",
      },
    );

    expect(opts).toHaveProperty("dispatcher");
  });

  it("does not inject dispatcher when no proxy is set", async () => {
    const opts = await createFetchOptions("https://example.com", {}, {});

    expect(opts).not.toHaveProperty("dispatcher");
  });

  it("falls back to config-level proxy when options.proxy is not set", async () => {
    await resolveConfig({
      overrides: { proxy: "http://config-proxy:8080" },
    });

    const opts = await createFetchOptions("https://example.com", {}, {});

    expect(opts).toHaveProperty("dispatcher");
  });

  it("allows per-request opt-out via proxy: false when config proxy is set", async () => {
    await resolveConfig({
      overrides: { proxy: "http://config-proxy:8080" },
    });

    const opts = await createFetchOptions("https://example.com", {}, { proxy: false });

    expect(opts).not.toHaveProperty("dispatcher");
  });
});
