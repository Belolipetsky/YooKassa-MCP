import { describe, expect, it } from "vitest";
import { findOperation, operations, searchOperations } from "../src/catalog.js";
import { searchDocumentation } from "../src/documentation.js";

describe("operation catalog", () => {
  it("does not advertise a nonexistent list payment methods endpoint", () => {
    expect(findOperation("list_payment_methods")).toBeUndefined();
  });

  it("marks every POST as a write requiring idempotency", () => {
    for (const operation of operations.filter((item) => item.method === "POST")) {
      expect(operation.write).toBe(true);
      expect(operation.idempotenceKey).toBe(true);
    }
  });

  it("finds refund operations in Russian", () => {
    expect(searchOperations("возврат").map((item) => item.id)).toEqual(
      expect.arrayContaining(["create_refund", "get_refund", "list_refunds"]),
    );
  });

  it("returns only official YooKassa and FNS documentation hosts", () => {
    const hosts = searchDocumentation("").map((entry) => new URL(entry.url).hostname);
    expect(new Set(hosts)).toEqual(new Set(["yookassa.ru", "www.nalog.gov.ru"]));
  });
});
