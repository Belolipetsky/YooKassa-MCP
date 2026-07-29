import type { Operation } from "./types.js";

const API_DOCS = "https://yookassa.ru/developers/api";

export const operations: Operation[] = [
  {
    id: "create_payment",
    method: "POST",
    path: "/payments",
    summary: "Создать платеж",
    description: "Создает платеж. MCP не выполняет операцию, но может проверить тело запроса.",
    write: true,
    idempotenceKey: true,
    required: ["amount"],
    documentationUrl: `${API_DOCS}#create_payment`,
  },
  {
    id: "list_payments",
    method: "GET",
    path: "/payments",
    summary: "Получить список платежей",
    description: "Возвращает платежи с фильтрами и курсорной пагинацией.",
    write: false,
    idempotenceKey: false,
    required: [],
    documentationUrl: `${API_DOCS}#get_payments_list`,
  },
  {
    id: "get_payment",
    method: "GET",
    path: "/payments/{payment_id}",
    summary: "Получить платеж",
    description: "Возвращает платеж по идентификатору.",
    write: false,
    idempotenceKey: false,
    required: ["payment_id"],
    documentationUrl: `${API_DOCS}#get_payment`,
  },
  {
    id: "capture_payment",
    method: "POST",
    path: "/payments/{payment_id}/capture",
    summary: "Подтвердить платеж",
    description: "Подтверждает двухстадийный платеж. MCP только валидирует будущий запрос.",
    write: true,
    idempotenceKey: true,
    required: ["payment_id"],
    documentationUrl: `${API_DOCS}#capture_payment`,
  },
  {
    id: "cancel_payment",
    method: "POST",
    path: "/payments/{payment_id}/cancel",
    summary: "Отменить платеж",
    description: "Отменяет платеж в статусе waiting_for_capture. MCP операцию не выполняет.",
    write: true,
    idempotenceKey: true,
    required: ["payment_id"],
    documentationUrl: `${API_DOCS}#cancel_payment`,
  },
  {
    id: "create_payment_method",
    method: "POST",
    path: "/payment_methods",
    summary: "Создать способ оплаты",
    description: "Создает сохраненный способ оплаты. MCP операцию не выполняет.",
    write: true,
    idempotenceKey: true,
    required: ["payment_method_data", "confirmation"],
    documentationUrl: `${API_DOCS}#create_payment_method`,
  },
  {
    id: "get_payment_method",
    method: "GET",
    path: "/payment_methods/{payment_method_id}",
    summary: "Получить способ оплаты",
    description: "Получает сохраненный способ оплаты по ID. Списочного GET-метода нет.",
    write: false,
    idempotenceKey: false,
    required: ["payment_method_id"],
    documentationUrl: `${API_DOCS}#get_payment_method`,
  },
  {
    id: "create_refund",
    method: "POST",
    path: "/refunds",
    summary: "Создать возврат",
    description: "Создает полный или частичный возврат. Поле amount обязательно.",
    write: true,
    idempotenceKey: true,
    required: ["payment_id", "amount"],
    documentationUrl: `${API_DOCS}#create_refund`,
  },
  {
    id: "list_refunds",
    method: "GET",
    path: "/refunds",
    summary: "Получить список возвратов",
    description: "Возвращает возвраты с фильтрами и курсорной пагинацией.",
    write: false,
    idempotenceKey: false,
    required: [],
    documentationUrl: `${API_DOCS}#get_refunds_list`,
  },
  {
    id: "get_refund",
    method: "GET",
    path: "/refunds/{refund_id}",
    summary: "Получить возврат",
    description: "Возвращает возврат по идентификатору.",
    write: false,
    idempotenceKey: false,
    required: ["refund_id"],
    documentationUrl: `${API_DOCS}#get_refund`,
  },
  {
    id: "create_receipt",
    method: "POST",
    path: "/receipts",
    summary: "Создать чек",
    description: "Создает отдельный чек. MCP только проверяет структуру будущего запроса.",
    write: true,
    idempotenceKey: true,
    required: ["type", "send", "customer", "items"],
    documentationUrl: `${API_DOCS}#create_receipt`,
  },
  {
    id: "list_receipts",
    method: "GET",
    path: "/receipts",
    summary: "Получить список чеков",
    description: "Возвращает чеки по платежу, возврату или типу.",
    write: false,
    idempotenceKey: false,
    required: [],
    documentationUrl: `${API_DOCS}#get_receipts_list`,
  },
  {
    id: "get_receipt",
    method: "GET",
    path: "/receipts/{receipt_id}",
    summary: "Получить чек",
    description: "Возвращает чек по идентификатору.",
    write: false,
    idempotenceKey: false,
    required: ["receipt_id"],
    documentationUrl: `${API_DOCS}#get_receipt`,
  },
];

export function findOperation(id: string): Operation | undefined {
  return operations.find((operation) => operation.id === id);
}

export function searchOperations(query: string): Operation[] {
  const terms = query.toLocaleLowerCase("ru").split(/\s+/).filter(Boolean);
  if (terms.length === 0) return operations;
  return operations.filter((operation) => {
    const haystack = [
      operation.id,
      operation.method,
      operation.path,
      operation.summary,
      operation.description,
    ].join(" ").toLocaleLowerCase("ru");
    return terms.every((term) => haystack.includes(term));
  });
}
