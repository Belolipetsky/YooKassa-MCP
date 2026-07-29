export type DocumentationEntry = {
  id: string;
  title: string;
  url: string;
  topics: string[];
  guidance: string;
};

export const documentation: DocumentationEntry[] = [
  {
    id: "api",
    title: "API ЮKassa",
    url: "https://yookassa.ru/developers/api",
    topics: ["api", "платеж", "возврат", "чек", "способ оплаты"],
    guidance: "Справочник методов, объектов, параметров и ошибок API v3.",
  },
  {
    id: "openapi",
    title: "OpenAPI-спецификация ЮKassa",
    url: "https://yookassa.ru/developers/using-api/openapi-specification",
    topics: ["openapi", "схема", "генерация", "валидация"],
    guidance: "Машиночитаемый контракт API. Сверяйте с changelog перед релизом.",
  },
  {
    id: "interaction",
    title: "Формат взаимодействия с API",
    url: "https://yookassa.ru/developers/using-api/interaction-format",
    topics: ["аутентификация", "basic auth", "идемпотентность", "формат"],
    guidance: "Basic Auth для магазина, JSON, HTTPS и Idempotence-Key для POST.",
  },
  {
    id: "webhooks",
    title: "Входящие уведомления",
    url: "https://yookassa.ru/developers/using-api/webhooks",
    topics: ["webhook", "уведомление", "подпись", "статус"],
    guidance: "Обработчик должен проверять объект через API, быть идемпотентным и быстро отвечать HTTP 200.",
  },
  {
    id: "testing",
    title: "Тестирование платежей",
    url: "https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing",
    topics: ["тест", "магазин", "карта", "sandbox", "диагностика"],
    guidance: "Для тестового магазина используйте отдельные реквизиты; у тестового платежа test=true.",
  },
  {
    id: "receipts",
    title: "Чеки: основы",
    url: "https://yookassa.ru/developers/payment-acceptance/receipts/basics",
    topics: ["чек", "receipt", "касса", "фискализация"],
    guidance: "Выберите схему отправки чеков и согласуйте ее с платежным жизненным циклом.",
  },
  {
    id: "54fz",
    title: "Работа по 54-ФЗ через ЮKassa",
    url: "https://yookassa.ru/developers/payment-acceptance/receipts/54fz/basics",
    topics: ["54-фз", "54фз", "чек", "ффд", "налог", "ндс"],
    guidance: "Техническая инструкция ЮKassa по данным чека. Юридические и налоговые решения подтвердите у профильного специалиста.",
  },
  {
    id: "fns-54fz",
    title: "ФНС: Федеральный закон № 54-ФЗ",
    url: "https://www.nalog.gov.ru/rn77/about_fts/docs/3909988/",
    topics: ["54-фз", "закон", "фнс", "ккт"],
    guidance: "Первичный официальный источник текста закона и изменений.",
  },
  {
    id: "changelog",
    title: "История изменений API ЮKassa",
    url: "https://yookassa.ru/developers/using-api/changelog",
    topics: ["changelog", "изменения", "версия", "миграция"],
    guidance: "Проверяйте перед реализацией и релизом, чтобы не опираться на устаревший контракт.",
  },
];

export function searchDocumentation(query: string): DocumentationEntry[] {
  const terms = query.toLocaleLowerCase("ru").split(/\s+/).filter(Boolean);
  if (terms.length === 0) return documentation;
  return documentation.filter((entry) => {
    const haystack = [entry.id, entry.title, entry.guidance, ...entry.topics]
      .join(" ")
      .toLocaleLowerCase("ru");
    return terms.every((term) => haystack.includes(term));
  });
}
