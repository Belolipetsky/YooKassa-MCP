import { describe, expect, it } from "vitest";
import { paymentMethodSummary, paymentSummary, receiptSummary } from "../src/summaries.js";

describe("safe summaries", () => {
  it("does not return customer, metadata or authorization-adjacent fields", () => {
    const result = paymentSummary({
      id: "p-1",
      status: "succeeded",
      test: true,
      amount: { value: "10.00", currency: "RUB" },
      metadata: { internal_user_id: "secret" },
      recipient: { account_id: "shop" },
      customer: { email: "buyer@example.com" },
    });
    const json = JSON.stringify(result);
    expect(json).not.toContain("buyer@example.com");
    expect(json).not.toContain("internal_user_id");
    expect(json).not.toContain("account_id");
  });

  it("returns only non-sensitive card fragments", () => {
    const result = paymentMethodSummary({
      id: "pm-1",
      type: "bank_card",
      card: {
        first6: "555555",
        last4: "4444",
        card_type: "MasterCard",
        expiry_year: "2030",
        expiry_month: "12",
        number: "5555555555554444",
        csc: "123",
      },
    });
    const json = JSON.stringify(result);
    expect(json).toContain("4444");
    expect(json).not.toContain("5555555555554444");
    expect(json).not.toContain("123");
  });

  it("omits receipt customer contact while preserving fiscal diagnostics", () => {
    const result = receiptSummary({
      id: "r-1",
      type: "payment",
      status: "succeeded",
      customer: { email: "buyer@example.com", phone: "79000000000" },
      items: [{
        description: "Услуга",
        quantity: "1.000",
        amount: { value: "100.00", currency: "RUB" },
        vat_code: 1,
        payment_mode: "full_payment",
        payment_subject: "service",
      }],
    });
    const json = JSON.stringify(result);
    expect(json).toContain("Услуга");
    expect(json).not.toContain("buyer@example.com");
    expect(json).not.toContain("79000000000");
  });
});
