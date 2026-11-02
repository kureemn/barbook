import { describe, expect, it, vi } from "vitest";
import { retry } from "../lib/retry";

describe("retry", () => {
  it("returns the result of a task that succeeds", async () => {
    const task = vi.fn().mockResolvedValue("session");
    await expect(retry(task, 3, 0)).resolves.toBe("session");
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("recovers from an aborted request", async () => {
    const task = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("signal is aborted", "AbortError"))
      .mockResolvedValue("session");
    await expect(retry(task, 3, 0)).resolves.toBe("session");
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("gives up after the last attempt", async () => {
    const task = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(retry(task, 3, 0)).rejects.toThrow("offline");
    expect(task).toHaveBeenCalledTimes(3);
  });
});
