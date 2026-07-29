import type { SafeError } from "./types.js";

type ApiErrorBody = {
  code?: unknown;
  description?: unknown;
  parameter?: unknown;
  id?: unknown;
  type?: unknown;
};

export class YooKassaAgentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly nextStep: string,
    public readonly httpStatus?: number,
    public readonly parameter?: string,
  ) {
    super(message);
    this.name = "YooKassaAgentError";
  }
}

const nextSteps: Record<number, string> = {
  400: "Проверьте URL, HTTP-метод, JSON и обязательные заголовки.",
  401: "Проверьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY тестового магазина.",
  403: "Проверьте права магазина и доступность функции в настройках ЮKassa.",
  404: "Проверьте идентификатор объекта и принадлежность тестовому магазину.",
  409: "Повторите исходный идемпотентный запрос с тем же Idempotence-Key или проверьте состояние объекта.",
  415: "Передайте Content-Type: application/json.",
  422: "Исправьте указанный параметр по OpenAPI и документации метода.",
  429: "Добавьте ограниченный exponential backoff с jitter и повторите запрос позднее.",
  500: "Сохраните request-id, повторите безопасно и при повторении обратитесь в поддержку ЮKassa.",
};

export function fromHttpError(status: number, body: unknown): YooKassaAgentError {
  const api = isObject(body) ? (body as ApiErrorBody) : {};
  const code = typeof api.code === "string" ? api.code : `HTTP_${status}`;
  const description = typeof api.description === "string"
    ? api.description
    : `ЮKassa вернула HTTP ${status}`;
  const parameter = typeof api.parameter === "string" ? api.parameter : undefined;
  return new YooKassaAgentError(
    code,
    description,
    nextSteps[status] ?? "Сверьте запрос с официальной документацией ЮKassa и повторите безопасно.",
    status,
    parameter,
  );
}

export function normalizeError(error: unknown): SafeError {
  if (error instanceof YooKassaAgentError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        nextStep: error.nextStep,
        ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
        ...(error.parameter === undefined ? {} : { parameter: error.parameter }),
      },
    };
  }
  return {
    ok: false,
    error: {
      code: "UNEXPECTED_ERROR",
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
      nextStep: "Повторите операцию. Если ошибка сохраняется, включите диагностический лог без секретов.",
    },
  };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
