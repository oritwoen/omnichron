import { describe, it, expect } from "vitest";
import { processInParallel, waybackTimestampToISO } from "../src/utils";

describe("processInParallel", () => {
  it("preserves input order regardless of completion order", async () => {
    const items = [300, 200, 100, 50, 10];

    const result = await processInParallel(
      items,
      (delay) =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve(`done-${delay}`), delay);
        }),
      { concurrency: 2, batchSize: 10 },
    );

    expect(result).toEqual(["done-300", "done-200", "done-100", "done-50", "done-10"]);
  });

  it("handles errors without breaking order of successful results", async () => {
    const items = [1, 2, 3, 4, 5];

    const result = await processInParallel(
      items,
      async (n) => {
        if (n === 3) throw new Error("fail");
        return n * 10;
      },
      { concurrency: 2, batchSize: 10 },
    );

    expect(result).toEqual([10, 20, 40, 50]);
  });

  it("processes small datasets via Promise.all (fast path)", async () => {
    const items = [1, 2];

    const result = await processInParallel(items, async (n) => n * 2, {
      concurrency: 5,
      batchSize: 10,
    });

    expect(result).toEqual([2, 4]);
  });
});

describe("waybackTimestampToISO", () => {
  it("converts a full CDX timestamp", () => {
    expect(waybackTimestampToISO("20220101153045")).toBe("2022-01-01T15:30:45Z");
    expect(waybackTimestampToISO("  20220101153045  ")).toBe("2022-01-01T15:30:45Z");
  });

  it("fills missing precision deterministically", () => {
    expect(waybackTimestampToISO("2022")).toBe("2022-01-01T00:00:00Z");
    expect(waybackTimestampToISO("202201")).toBe("2022-01-01T00:00:00Z");
    expect(waybackTimestampToISO("20220101")).toBe("2022-01-01T00:00:00Z");
    expect(waybackTimestampToISO("2022010115")).toBe("2022-01-01T15:00:00Z");
    expect(waybackTimestampToISO("202201011530")).toBe("2022-01-01T15:30:00Z");
    expect(waybackTimestampToISO("20200229000000")).toBe("2020-02-29T00:00:00Z");
  });

  it("returns empty string for malformed values", () => {
    expect(waybackTimestampToISO("")).toBe("");
    expect(waybackTimestampToISO("202201011")).toBe("");
    expect(waybackTimestampToISO("abcd")).toBe("");
    expect(waybackTimestampToISO("20221301120000")).toBe("");
    expect(waybackTimestampToISO("20220230000000")).toBe("");
    expect(waybackTimestampToISO("20220001000000")).toBe("");
    expect(waybackTimestampToISO("20220000000000")).toBe("");
    expect(waybackTimestampToISO("20220101250000")).toBe("");
    expect(waybackTimestampToISO("20220101006000")).toBe("");
    expect(waybackTimestampToISO("20220101000060")).toBe("");
    expect(waybackTimestampToISO("20210229000000")).toBe("");
  });

  it("handles max year boundary", () => {
    expect(waybackTimestampToISO("99990101000000")).toBe("9999-01-01T00:00:00Z");
  });
});
