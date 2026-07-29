import { YooKassaAgentError, isObject } from "./errors.js";

export type StoreMode = "unknown" | "test" | "production-blocked";

export class TestStoreGuard {
  private mode: StoreMode = "unknown";

  getMode(): StoreMode {
    return this.mode;
  }

  observePayment(payment: unknown): void {
    if (!isObject(payment)) {
      throw new YooKassaAgentError(
        "INVALID_API_RESPONSE",
        "Ответ платежа не является объектом.",
        "Повторите запрос и проверьте состояние API ЮKassa.",
      );
    }
    if (payment.test === false) {
      this.mode = "production-blocked";
      throw new YooKassaAgentError(
        "PRODUCTION_STORE_BLOCKED",
        "Обнаружен платеж настоящего магазина (test=false). Плагин не возвращает производственные данные.",
        "Замените YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY на реквизиты тестового магазина и перезапустите Codex.",
      );
    }
    if (payment.test !== true) {
      throw new YooKassaAgentError(
        "TEST_MODE_NOT_CONFIRMED",
        "В ответе платежа отсутствует официальный признак test=true.",
        "Используйте платеж из тестового магазина или сначала выполните yookassa_diagnose_connection.",
      );
    }
    this.mode = "test";
  }

  requireConfirmedTestStore(): void {
    if (this.mode === "production-blocked") {
      throw new YooKassaAgentError(
        "PRODUCTION_STORE_BLOCKED",
        "Этот процесс уже обнаружил реквизиты настоящего магазина.",
        "Замените переменные окружения реквизитами тестового магазина и перезапустите Codex.",
      );
    }
    if (this.mode !== "test") {
      throw new YooKassaAgentError(
        "TEST_MODE_NOT_CONFIRMED",
        "Тестовый магазин еще не подтвержден.",
        "Сначала вызовите yookassa_diagnose_connection. В тестовом магазине должен существовать хотя бы один платеж с test=true.",
      );
    }
  }
}
