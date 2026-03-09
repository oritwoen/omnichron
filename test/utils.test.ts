import { describe, it, expect } from "vitest";
import { processInParallel } from "../src/utils";

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
