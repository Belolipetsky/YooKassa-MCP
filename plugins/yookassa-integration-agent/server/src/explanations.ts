const explanations: Record<string, { meaning: string; nextSteps: string[] }> = {
  invalid_credentials: {
    meaning: "ЮKassa не смогла аутентифицировать магазин.",
    nextSteps: [
      "Проверьте порядок Basic Auth: shopId как логин, secret key как пароль.",
      "Убедитесь, что оба значения относятся к одному тестовому магазину.",
      "Перевыпустите тестовый ключ при подозрении на компрометацию.",
    ],
  },
  invalid_request: {
    meaning: "Запрос не соответствует контракту API.",
    nextSteps: [
      "Проверьте parameter и description в ответе.",
      "Запустите yookassa_validate_request для нужной операции.",
      "Сверьте метод с OpenAPI и changelog.",
    ],
  },
  forbidden: {
    meaning: "У магазина нет доступа к операции или способу оплаты.",
    nextSteps: [
      "Проверьте настройки тестового магазина.",
      "Учитывайте, что не все способы оплаты доступны в тестовом режиме.",
      "Если доступ должен быть, обратитесь к менеджеру или поддержке ЮKassa.",
    ],
  },
  not_found: {
    meaning: "Объект не найден или не принадлежит магазину из текущих реквизитов.",
    nextSteps: [
      "Проверьте ID без пробелов и подмены окружений.",
      "Не смешивайте идентификаторы тестового и настоящего магазина.",
    ],
  },
  too_many_requests: {
    meaning: "Превышена допустимая частота запросов.",
    nextSteps: [
      "Используйте exponential backoff с jitter.",
      "Не повторяйте POST с новым Idempotence-Key для той же бизнес-операции.",
    ],
  },
};

export function explainError(codeOrStatus: string): {
  input: string;
  meaning: string;
  nextSteps: string[];
  documentation: string;
} {
  const normalized = codeOrStatus.trim().toLowerCase();
  const byStatus: Record<string, string> = {
    "401": "invalid_credentials",
    "403": "forbidden",
    "404": "not_found",
    "422": "invalid_request",
    "429": "too_many_requests",
  };
  const key = byStatus[normalized] ?? normalized;
  const explanation = explanations[key] ?? {
    meaning: "Код не входит в локальный справочник.",
    nextSteps: [
      "Проверьте code, description, parameter и HTTP-статус.",
      "Сверьте код с официальной документацией обработки ответов ЮKassa.",
    ],
  };
  return {
    input: codeOrStatus,
    ...explanation,
    documentation: "https://yookassa.ru/developers/using-api/response-handling/http-codes",
  };
}
