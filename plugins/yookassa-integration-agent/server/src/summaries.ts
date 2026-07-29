import { isObject, YooKassaAgentError } from "./errors.js";
import type { JsonObject } from "./types.js";

function stringValue(object: JsonObject, key: string): string | undefined {
  return typeof object[key] === "string" ? object[key] : undefined;
}

function amountValue(value: unknown): { value?: string; currency?: string } | undefined {
  if (!isObject(value)) return undefined;
  return {
    ...(typeof value.value === "string" ? { value: value.value } : {}),
    ...(typeof value.currency === "string" ? { currency: value.currency } : {}),
  };
}

export function paymentSummary(payment: JsonObject): JsonObject {
  const paymentMethod = isObject(payment.payment_method) ? payment.payment_method : undefined;
  return {
    id: stringValue(payment, "id"),
    status: stringValue(payment, "status"),
    paid: typeof payment.paid === "boolean" ? payment.paid : undefined,
    refundable: typeof payment.refundable === "boolean" ? payment.refundable : undefined,
    test: payment.test === true,
    amount: amountValue(payment.amount),
    income_amount: amountValue(payment.income_amount),
    created_at: stringValue(payment, "created_at"),
    captured_at: stringValue(payment, "captured_at"),
    payment_method: paymentMethod ? {
      type: stringValue(paymentMethod, "type"),
      status: stringValue(paymentMethod, "status"),
      saved: typeof paymentMethod.saved === "boolean" ? paymentMethod.saved : undefined,
    } : undefined,
    cancellation_details: isObject(payment.cancellation_details)
      ? {
          party: stringValue(payment.cancellation_details, "party"),
          reason: stringValue(payment.cancellation_details, "reason"),
        }
      : undefined,
  };
}

export function refundSummary(refund: JsonObject): JsonObject {
  return {
    id: stringValue(refund, "id"),
    payment_id: stringValue(refund, "payment_id"),
    status: stringValue(refund, "status"),
    amount: amountValue(refund.amount),
    created_at: stringValue(refund, "created_at"),
    cancellation_details: isObject(refund.cancellation_details)
      ? {
          party: stringValue(refund.cancellation_details, "party"),
          reason: stringValue(refund.cancellation_details, "reason"),
        }
      : undefined,
  };
}

export function receiptSummary(receipt: JsonObject): JsonObject {
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  return {
    id: stringValue(receipt, "id"),
    type: stringValue(receipt, "type"),
    status: stringValue(receipt, "status"),
    payment_id: stringValue(receipt, "payment_id"),
    refund_id: stringValue(receipt, "refund_id"),
    fiscal_document_number: stringValue(receipt, "fiscal_document_number"),
    fiscal_storage_number: stringValue(receipt, "fiscal_storage_number"),
    registered_at: stringValue(receipt, "registered_at"),
    item_count: items.length,
    items: items.slice(0, 20).map((item) => {
      if (!isObject(item)) return {};
      return {
        description: stringValue(item, "description"),
        quantity: stringValue(item, "quantity"),
        amount: amountValue(item.amount),
        vat_code: typeof item.vat_code === "number" ? item.vat_code : undefined,
        payment_mode: stringValue(item, "payment_mode"),
        payment_subject: stringValue(item, "payment_subject"),
      };
    }),
  };
}

export function paymentMethodSummary(method: JsonObject): JsonObject {
  const card = isObject(method.card) ? method.card : undefined;
  return {
    id: stringValue(method, "id"),
    type: stringValue(method, "type"),
    status: stringValue(method, "status"),
    saved: typeof method.saved === "boolean" ? method.saved : undefined,
    title: stringValue(method, "title"),
    card: card ? {
      first6: stringValue(card, "first6"),
      last4: stringValue(card, "last4"),
      card_type: stringValue(card, "card_type"),
      expiry_year: stringValue(card, "expiry_year"),
      expiry_month: stringValue(card, "expiry_month"),
    } : undefined,
  };
}

export function listItems(response: JsonObject): JsonObject[] {
  if (!Array.isArray(response.items)) {
    throw new YooKassaAgentError(
      "INVALID_API_RESPONSE",
      "В списочном ответе ЮKassa отсутствует массив items.",
      "Сверьте актуальный формат ответа с OpenAPI и changelog.",
    );
  }
  return response.items.filter(isObject);
}

export function pagination(response: JsonObject): JsonObject {
  return {
    ...(typeof response.next_cursor === "string" ? { next_cursor: response.next_cursor } : {}),
  };
}
