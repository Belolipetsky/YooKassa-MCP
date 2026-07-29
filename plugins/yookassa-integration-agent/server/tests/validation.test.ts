import { describe, expect, it } from "vitest";
import { validateRequest } from "../src/validation.js";

describe("validateRequest", () => {
  it("requires amount and a stable idempotence key for refunds", () => {
    const result = validateRequest("create_refund", { payment_id: "p-1" });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain("amount");
    expect(result.issues.map((issue) => issue.path)).toContain("Idempotence-Key");
  });

  it("accepts a minimal payment receipt with fiscal fields", () => {
    const result = validateRequest("create_payment", {
      amount: { value: "100.00", currency: "RUB" },
      receipt: {
        customer: { email: "buyer@example.com" },
        items: [{
          description: "Подписка",
          quantity: "1.000",
          amount: { value: "100.00", currency: "RUB" },
          vat_code: 1,
          payment_mode: "full_payment",
          payment_subject: "service",
        }],
      },
    }, "order-42-create-payment");
    expect(result.valid).toBe(true);
  });

  it("requires a customer contact for receipt delivery", () => {
    const result = validateRequest("create_receipt", {
      type: "payment",
      send: true,
      payment_id: "p-1",
      customer: {},
      items: [{
        description: "Курс",
        quantity: "1.000",
        amount: { value: "500.00", currency: "RUB" },
        vat_code: 1,
        payment_mode: "full_payment",
        payment_subject: "service",
      }],
    }, "receipt-p-1");
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.path === "customer")).toBe(true);
  });

  it("rejects an unknown operation", () => {
    const result = validateRequest("create_magic_payment", {});
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe("Неизвестная операция");
  });

  it("requires path parameters for capture", () => {
    const result = validateRequest(
      "capture_payment",
      {},
      "capture-order-42",
    );
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain("path_params.payment_id");
  });

  it("accepts the capture path parameter separately from the body", () => {
    const result = validateRequest(
      "capture_payment",
      {},
      "capture-order-42",
      { payment_id: "p-42" },
    );
    expect(result.valid).toBe(true);
  });
});
