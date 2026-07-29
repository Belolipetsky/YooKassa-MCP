import { z } from "zod";
import { findOperation } from "./catalog.js";
import { isObject } from "./errors.js";

const money = z.object({
  value: z.string().regex(/^\d{1,10}\.\d{2}$/, "Сумма должна быть строкой с двумя знаками после точки"),
  currency: z.literal("RUB", "Для российского платежного сценария ожидается RUB"),
});

const customer = z.object({
  email: z.email().optional(),
  phone: z.string().regex(/^\d{4,15}$/, "Телефон передается цифрами, например 79000000000").optional(),
}).refine((value) => value.email || value.phone, {
  message: "Укажите email или phone покупателя",
});

const receiptItem = z.object({
  description: z.string().min(1).max(128),
  quantity: z.string().regex(/^\d+(?:\.\d{1,3})?$/, "Количество передается строкой"),
  amount: money,
  vat_code: z.number().int().min(1).max(12),
  payment_mode: z.enum([
    "full_prepayment",
    "partial_prepayment",
    "advance",
    "full_payment",
    "partial_payment",
    "credit",
    "credit_payment",
  ]),
  payment_subject: z.string().min(1),
  measure: z.string().optional(),
  mark_quantity: z.object({
    numerator: z.number().int().positive(),
    denominator: z.number().int().positive(),
  }).optional(),
}).loose();

const receipt = z.object({
  customer,
  items: z.array(receiptItem).min(1),
  tax_system_code: z.number().int().min(1).max(6).optional(),
}).loose();

const schemas: Record<string, z.ZodType> = {
  create_payment: z.object({
    amount: money,
    capture: z.boolean().optional(),
    confirmation: z.object({
      type: z.string().min(1),
      return_url: z.url().optional(),
    }).loose().optional(),
    description: z.string().max(128).optional(),
    receipt: receipt.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }).loose(),
  capture_payment: z.object({
    amount: money.optional(),
    receipt: receipt.optional(),
  }).loose(),
  cancel_payment: z.object({}).loose(),
  create_refund: z.object({
    payment_id: z.string().min(1),
    amount: money,
    description: z.string().max(250).optional(),
    receipt: receipt.optional(),
  }).loose(),
  create_receipt: z.object({
    type: z.enum(["payment", "refund"]),
    send: z.boolean(),
    customer,
    items: z.array(receiptItem).min(1),
    payment_id: z.string().min(1).optional(),
    refund_id: z.string().min(1).optional(),
    tax_system_code: z.number().int().min(1).max(6).optional(),
  }).loose().superRefine((value, context) => {
    if (value.type === "payment" && !value.payment_id) {
      context.addIssue({
        code: "custom",
        path: ["payment_id"],
        message: "Для чека типа payment нужен payment_id",
      });
    }
    if (value.type === "refund" && !value.refund_id) {
      context.addIssue({
        code: "custom",
        path: ["refund_id"],
        message: "Для чека типа refund нужен refund_id",
      });
    }
  }),
};

export type ValidationIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidationResult = {
  valid: boolean;
  operation: string;
  source: string;
  issues: ValidationIssue[];
  checks: string[];
};

export function validateRequest(
  operationId: string,
  body: unknown,
  idempotenceKey?: string,
  pathParams: Record<string, string> = {},
): ValidationResult {
  const operation = findOperation(operationId);
  if (!operation) {
    return {
      valid: false,
      operation: operationId,
      source: "Локальный каталог OpenAPI ЮKassa от 2026-07-29",
      issues: [{ path: "operation", message: "Неизвестная операция", severity: "error" }],
      checks: [],
    };
  }

  const issues: ValidationIssue[] = [];
  const checks = [
    `${operation.method} ${operation.path}`,
    operation.write ? "MCP не отправляет этот запрос" : "Read-only операция",
  ];

  const requiredPathParams = [...operation.path.matchAll(/\{([^}]+)\}/g)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name));
  for (const name of requiredPathParams) {
    if (!pathParams[name]?.trim()) {
      issues.push({
        path: `path_params.${name}`,
        message: `Для пути ${operation.path} нужен параметр ${name}`,
        severity: "error",
      });
    }
  }

  const schema = schemas[operationId];
  if (schema) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          path: issue.path.join(".") || "body",
          message: issue.message,
          severity: "error",
        });
      }
    }
  } else if (!isObject(body)) {
    issues.push({ path: "body", message: "Тело должно быть JSON-объектом", severity: "error" });
  }

  if (operation.idempotenceKey) {
    if (!idempotenceKey) {
      issues.push({
        path: "Idempotence-Key",
        message: "Для POST нужен стабильный ключ идемпотентности, сохраняемый вместе с бизнес-операцией",
        severity: "error",
      });
    } else if (idempotenceKey.length > 64) {
      issues.push({
        path: "Idempotence-Key",
        message: "Ключ идемпотентности должен быть не длиннее 64 символов",
        severity: "error",
      });
    } else {
      checks.push("Idempotence-Key присутствует и укладывается в 64 символа");
    }
  }

  if (isObject(body) && ("receipt" in body || operationId === "create_receipt")) {
    checks.push("Проверены базовые поля чека; налоговые значения нужно подтвердить у ответственного специалиста");
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    operation: operationId,
    source: "Локальный каталог OpenAPI ЮKassa от 2026-07-29; перед релизом проверьте changelog",
    issues,
    checks,
  };
}
