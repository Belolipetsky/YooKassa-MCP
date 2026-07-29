import { describe, expect, it } from "vitest";
import { TestStoreGuard } from "../src/safety.js";

describe("TestStoreGuard", () => {
  it("confirms a test store only from test=true", () => {
    const guard = new TestStoreGuard();
    guard.observePayment({ id: "p-1", test: true });
    expect(guard.getMode()).toBe("test");
    expect(() => guard.requireConfirmedTestStore()).not.toThrow();
  });

  it("rejects an ambiguous response", () => {
    const guard = new TestStoreGuard();
    expect(() => guard.observePayment({ id: "p-1" })).toThrowError(/test=true/);
    expect(guard.getMode()).toBe("unknown");
  });

  it("locks the process after production data is detected", () => {
    const guard = new TestStoreGuard();
    expect(() => guard.observePayment({ id: "p-live", test: false }))
      .toThrowError(/настоящего магазина/);
    expect(guard.getMode()).toBe("production-blocked");
    expect(() => guard.requireConfirmedTestStore()).toThrowError(/настоящего магазина/);
  });
});
