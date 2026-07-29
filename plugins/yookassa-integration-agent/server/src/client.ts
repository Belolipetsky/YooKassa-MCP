import { fromHttpError, isObject, YooKassaAgentError } from "./errors.js";
import type { JsonObject } from "./types.js";

const API_BASE_URL = "https://api.yookassa.ru/v3";
const REQUEST_TIMEOUT_MS = 15_000;

function credentials(): { shopId: string; secretKey: string } {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) {
    throw new YooKassaAgentError(
      "MISSING_CREDENTIALS",
      "Не заданы YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.",
      "Добавьте реквизиты тестового магазина в локальное окружение Codex и перезапустите MCP.",
    );
  }
  return { shopId, secretKey };
}

function queryString(query?: Record<string, string | number | undefined>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export class YooKassaReadOnlyClient {
  async get(path: string, query?: Record<string, string | number | undefined>): Promise<JsonObject> {
    if (!path.startsWith("/") || path.includes("..")) {
      throw new YooKassaAgentError(
        "INVALID_PATH",
        "Недопустимый путь API.",
        "Используйте только предопределенные read-only инструменты.",
      );
    }
    const { shopId, secretKey } = credentials();
    const auth = Buffer.from(`${shopId}:${secretKey}`, "utf8").toString("base64");
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}${queryString(query)}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "User-Agent": "yookassa-codex-integration-agent/0.1.0",
        },
        signal,
      });
    } catch (error) {
      throw new YooKassaAgentError(
        "NETWORK_ERROR",
        error instanceof Error ? error.message : "Сетевая ошибка при обращении к ЮKassa.",
        "Проверьте доступ к api.yookassa.ru и повторите запрос. Секреты в лог не выводятся.",
      );
    }

    const raw = await response.text();
    let body: unknown = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        throw new YooKassaAgentError(
          "INVALID_API_RESPONSE",
          `ЮKassa вернула не-JSON ответ с HTTP ${response.status}.`,
          "Сохраните request-id из заголовков и повторите запрос позднее.",
          response.status,
        );
      }
    }
    if (!response.ok) throw fromHttpError(response.status, body);
    if (!isObject(body)) {
      throw new YooKassaAgentError(
        "INVALID_API_RESPONSE",
        "ЮKassa вернула JSON не в ожидаемом объектном формате.",
        "Сверьте актуальную OpenAPI-спецификацию и changelog.",
        response.status,
      );
    }
    return body;
  }
}
