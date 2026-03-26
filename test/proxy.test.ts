import { describe, it, expect, beforeEach } from "vitest";
import { resolveProxyUrl, createProxyDispatcher, createFetchOptions } from "../src/utils";
import { resetConfig } from "../src/config";

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
});

describe("createProxyDispatcher", () => {
  it("returns a ProxyAgent instance", () => {
    const dispatcher = createProxyDispatcher("http://proxy:8080");
    expect(dispatcher).toBeDefined();
    expect(dispatcher.constructor.name).toBe("ProxyAgent");
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
});
