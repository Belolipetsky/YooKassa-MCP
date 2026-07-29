import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findOperation, searchOperations } from "./catalog.js";
import { YooKassaReadOnlyClient } from "./client.js";
import { searchDocumentation } from "./documentation.js";
import { normalizeError, isObject, YooKassaAgentError } from "./errors.js";
import { explainError } from "./explanations.js";
import { TestStoreGuard } from "./safety.js";
import {
  listItems,
  pagination,
  paymentMethodSummary,
  paymentSummary,
  receiptSummary,
  refundSummary,
} from "./summaries.js";
import type { JsonObject } from "./types.js";
import { validateRequest } from "./validation.js";

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const objectId = z.string().min(1).max(128).regex(
  /^[A-Za-z0-9_-]+$/,
  "ID может содержать только латинские буквы, цифры, _ и -",
);
const cursor = z.string().min(1).max(256).optional();
const limit20 = z.number().int().min(1).max(20).default(10);
const limit10 = z.number().int().min(1).max(10).default(10);

function toolResult(payload: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

async function safely<T>(action: () => Promise<T> | T) {
  try {
    return toolResult({ ok: true, data: await action() });
  } catch (error) {
    return toolResult(normalizeError(error), true);
  }
}

function stringField(object: JsonObject, key: string): string | undefined {
  return typeof object[key] === "string" ? object[key] : undefined;
}

export function registerTools(
  server: McpServer,
  client = new YooKassaReadOnlyClient(),
  guard = new TestStoreGuard(),
): void {
  async function verifyPayment(paymentId: string): Promise<void> {
    const payment = await client.get(`/payments/${paymentId}`);
    guard.observePayment(payment);
  }

  async function verifyLinkedPayment(object: JsonObject): Promise<void> {
    const paymentId = stringField(object, "payment_id");
    if (!paymentId) {
      throw new YooKassaAgentError(
        "TEST_MODE_NOT_CONFIRMED",
        "Объект не содержит payment_id, по которому можно подтвердить тестовый магазин.",
        "Сначала выполните yookassa_diagnose_connection на магазине с тестовым платежом.",
      );
    }
    await verifyPayment(paymentId);
  }

  server.registerTool(
    "yookassa_search_documentation",
    {
      title: "Поиск по официальной документации ЮKassa",
      description: "Ищет только в локальном allowlist официальных документов ЮKassa и ФНС. Не выполняет сетевой поиск.",
      inputSchema: z.object({
        query: z.string().max(200).default(""),
      }),
      annotations,
    },
    async ({ query }) => safely(() => ({
      query,
      results: searchDocumentation(query),
      note: "Перед релизом откройте ссылку и проверьте актуальную редакцию.",
    })),
  );

  server.registerTool(
    "yookassa_api_search",
    {
      title: "Поиск операции API ЮKassa",
      description: "Ищет операции в локальном каталоге официального OpenAPI-снимка.",
      inputSchema: z.object({
        query: z.string().max(200).default(""),
        include_writes: z.boolean().default(true),
      }),
      annotations,
    },
    async ({ query, include_writes }) => safely(() => ({
      query,
      results: searchOperations(query)
        .filter((operation) => include_writes || !operation.write)
        .map((operation) => ({
          id: operation.id,
          method: operation.method,
          path: operation.path,
          summary: operation.summary,
          write: operation.write,
        })),
      note: "Write-операции доступны только как справка и офлайн-валидация; MCP их не выполняет.",
    })),
  );

  server.registerTool(
    "yookassa_api_details",
    {
      title: "Детали операции API ЮKassa",
      description: "Возвращает метод, путь, обязательные поля и официальную ссылку для операции.",
      inputSchema: z.object({
        operation_id: z.string().min(1).max(100),
      }),
      annotations,
    },
    async ({ operation_id }) => safely(() => {
      const operation = findOperation(operation_id);
      if (!operation) {
        throw new YooKassaAgentError(
          "UNKNOWN_OPERATION",
          `Операция ${operation_id} не найдена в локальном каталоге.`,
          "Вызовите yookassa_api_search по смысловому запросу.",
        );
      }
      return {
        ...operation,
        execution: operation.write
          ? "Только проектирование и офлайн-валидация"
          : "Доступна read-only диагностика тестового магазина",
      };
    }),
  );

  server.registerTool(
    "yookassa_validate_request",
    {
      title: "Проверка запроса ЮKassa без отправки",
      description: "Проверяет JSON будущего запроса по базовым OpenAPI и 54-ФЗ правилам. Никаких запросов к ЮKassa не отправляет.",
      inputSchema: z.object({
        operation_id: z.string().min(1).max(100),
        body: z.record(z.string(), z.unknown()),
        idempotence_key: z.string().max(256).optional(),
        path_params: z.record(z.string(), z.string().min(1).max(128)).optional(),
      }),
      annotations,
    },
    async ({ operation_id, body, idempotence_key, path_params }) => safely(() =>
      validateRequest(operation_id, body, idempotence_key, path_params)
    ),
  );

  server.registerTool(
    "yookassa_explain_error",
    {
      title: "Объяснение ошибки ЮKassa",
      description: "Объясняет HTTP-статус или код ошибки и предлагает безопасные следующие шаги.",
      inputSchema: z.object({
        code_or_status: z.string().min(1).max(100),
      }),
      annotations,
    },
    async ({ code_or_status }) => safely(() => explainError(code_or_status)),
  );

  server.registerTool(
    "yookassa_diagnose_connection",
    {
      title: "Диагностика тестового магазина ЮKassa",
      description: "Проверяет реквизиты read-only запросом максимум одного платежа и подтверждает test=true. Производственные данные блокируются.",
      inputSchema: z.object({}),
      annotations,
    },
    async () => safely(async () => {
      const response = await client.get("/payments", { limit: 1 });
      const items = listItems(response);
      if (items.length === 0) {
        return {
          connected: true,
          testMode: "unconfirmed",
          reason: "В магазине нет платежа, по которому можно проверить официальный признак test=true.",
          nextStep: "Создайте один тестовый платеж из приложения, затем повторите диагностику.",
        };
      }
      const payment = items[0];
      if (!payment) throw new Error("Пустой элемент платежа");
      guard.observePayment(payment);
      const safePayment = paymentSummary(payment);
      return {
        connected: true,
        testMode: "confirmed",
        guard: guard.getMode(),
        sample: {
          id: safePayment.id,
          status: safePayment.status,
          test: safePayment.test,
          created_at: safePayment.created_at,
        },
      };
    }),
  );

  server.registerTool(
    "yookassa_get_payment",
    {
      title: "Получить тестовый платеж",
      description: "Возвращает минимизированные данные платежа только при test=true.",
      inputSchema: z.object({ payment_id: objectId }),
      annotations,
    },
    async ({ payment_id }) => safely(async () => {
      const payment = await client.get(`/payments/${payment_id}`);
      guard.observePayment(payment);
      return paymentSummary(payment);
    }),
  );

  server.registerTool(
    "yookassa_list_payments",
    {
      title: "Список тестовых платежей",
      description: "Возвращает до 20 минимизированных платежей; каждый непустой результат обязан иметь test=true.",
      inputSchema: z.object({
        limit: limit20,
        cursor,
        status: z.enum(["pending", "waiting_for_capture", "succeeded", "canceled"]).optional(),
        created_at_gte: z.iso.datetime().optional(),
        created_at_lte: z.iso.datetime().optional(),
      }),
      annotations,
    },
    async ({ limit, cursor: nextCursor, status, created_at_gte, created_at_lte }) => safely(async () => {
      const response = await client.get("/payments", {
        limit,
        cursor: nextCursor,
        status,
        "created_at.gte": created_at_gte,
        "created_at.lte": created_at_lte,
      });
      const items = listItems(response);
      for (const payment of items) guard.observePayment(payment);
      return {
        items: items.map(paymentSummary),
        ...pagination(response),
        testMode: items.length > 0 ? "confirmed" : guard.getMode(),
      };
    }),
  );

  server.registerTool(
    "yookassa_get_refund",
    {
      title: "Получить возврат тестового магазина",
      description: "Получает возврат и подтверждает связанный платеж с test=true.",
      inputSchema: z.object({ refund_id: objectId }),
      annotations,
    },
    async ({ refund_id }) => safely(async () => {
      const refund = await client.get(`/refunds/${refund_id}`);
      await verifyLinkedPayment(refund);
      return refundSummary(refund);
    }),
  );

  server.registerTool(
    "yookassa_list_refunds",
    {
      title: "Список возвратов тестового магазина",
      description: "Возвращает до 10 возвратов после подтверждения каждого связанного платежа с test=true.",
      inputSchema: z.object({
        limit: limit10,
        cursor,
        payment_id: objectId.optional(),
        status: z.enum(["pending", "succeeded", "canceled"]).optional(),
      }),
      annotations,
    },
    async ({ limit, cursor: nextCursor, payment_id, status }) => safely(async () => {
      const response = await client.get("/refunds", {
        limit,
        cursor: nextCursor,
        payment_id,
        status,
      });
      const items = listItems(response);
      const verified = new Set<string>();
      for (const refund of items) {
        const linkedId = stringField(refund, "payment_id");
        if (!linkedId) await verifyLinkedPayment(refund);
        else if (!verified.has(linkedId)) {
          await verifyPayment(linkedId);
          verified.add(linkedId);
        }
      }
      return { items: items.map(refundSummary), ...pagination(response) };
    }),
  );

  server.registerTool(
    "yookassa_get_receipt",
    {
      title: "Получить чек тестового магазина",
      description: "Получает чек и подтверждает связанный платеж с test=true. Контакт покупателя не возвращается.",
      inputSchema: z.object({ receipt_id: objectId }),
      annotations,
    },
    async ({ receipt_id }) => safely(async () => {
      const receipt = await client.get(`/receipts/${receipt_id}`);
      await verifyLinkedPayment(receipt);
      return receiptSummary(receipt);
    }),
  );

  server.registerTool(
    "yookassa_list_receipts",
    {
      title: "Список чеков тестового магазина",
      description: "Возвращает до 10 минимизированных чеков после проверки связанных тестовых платежей.",
      inputSchema: z.object({
        limit: limit10,
        cursor,
        payment_id: objectId.optional(),
        refund_id: objectId.optional(),
        type: z.enum(["payment", "refund"]).optional(),
      }),
      annotations,
    },
    async ({ limit, cursor: nextCursor, payment_id, refund_id, type }) => safely(async () => {
      const response = await client.get("/receipts", {
        limit,
        cursor: nextCursor,
        payment_id,
        refund_id,
        type,
      });
      const items = listItems(response);
      const verified = new Set<string>();
      for (const receipt of items) {
        const linkedId = stringField(receipt, "payment_id");
        if (!linkedId) await verifyLinkedPayment(receipt);
        else if (!verified.has(linkedId)) {
          await verifyPayment(linkedId);
          verified.add(linkedId);
        }
      }
      return { items: items.map(receiptSummary), ...pagination(response) };
    }),
  );

  server.registerTool(
    "yookassa_get_payment_method",
    {
      title: "Получить способ оплаты тестового магазина",
      description: "Доступен только после подтверждения тестового магазина через платеж с test=true. Возвращает только безопасные карточные атрибуты.",
      inputSchema: z.object({ payment_method_id: objectId }),
      annotations,
    },
    async ({ payment_method_id }) => safely(async () => {
      guard.requireConfirmedTestStore();
      const method = await client.get(`/payment_methods/${payment_method_id}`);
      if (!isObject(method)) throw new Error("Некорректный объект способа оплаты");
      return paymentMethodSummary(method);
    }),
  );
}
