export type JourneyStepId = "plan" | "implement" | "validate" | "diagnose";

export interface JourneyStep {
  id: JourneyStepId;
  title: string;
  description: string;
}

export interface SkillItem {
  slug: string;
  title: string;
  description: string;
}

export interface InstallCommand {
  label: string;
  command: string;
}

export interface SourceLink {
  label: string;
  description: string;
  href: string;
}

export interface WorkspaceState {
  tab: string;
  request: string;
  answer: string;
  plan: string[];
  code: string[];
  checks: string[];
  result: string;
}

export const journeySteps: JourneyStep[] = [
  {
    id: "plan",
    title: "Спроектировать",
    description: "Архитектура, потоки, последовательности и выбор подхода.",
  },
  {
    id: "implement",
    title: "Реализовать",
    description: "Генерация кода интеграции по требованиям и лучшим практикам ЮKassa.",
  },
  {
    id: "validate",
    title: "Проверить",
    description: "Валидация запросов, ответов, идемпотентности и чеков.",
  },
  {
    id: "diagnose",
    title: "Диагностировать",
    description: "Read-only проверка соединения и объектов тестового магазина.",
  },
];

export const workspaceStates: Record<JourneyStepId, WorkspaceState> = {
  plan: {
    tab: "Архитектура",
    request: "Спроектируй прием платежей картой на сайте. Фронтенд — React, бэкенд — Node.js.",
    answer: "Соберу безопасный flow, определю владельцев данных чека и состояния восстановления.",
    plan: [
      "Выбор одно- или двухстадийной оплаты",
      "Модель статусов и идемпотентности",
      "Webhook и сверка состояния",
      "Чек и обязательные реквизиты",
    ],
    code: [
      "POST /payments",
      "  → confirmation.redirect",
      "  → payment.waiting_for_capture",
      "  → payment.succeeded",
      "",
      "Webhook → GET /payments/{id}",
    ],
    checks: [
      "Контур определен",
      "Владелец реквизитов указан",
      "Unknown state учтен",
      "Тест-план сформирован",
    ],
    result: "Архитектура согласована",
  },
  implement: {
    tab: "Код",
    request: "Нужна интеграция приема платежей картой на сайте. Фронтенд — React, бэкенд — Node.js/Express.",
    answer: "Предлагаю архитектуру и реализацию через API ЮKassa, обработчик уведомлений и валидацию подписи.",
    plan: [
      "Проектирование потоков и выбор подхода",
      "Создание платежа",
      "Обработчик уведомлений",
      "Валидация подписи и идемпотентность",
      "Проверка чеков и реквизитов",
    ],
    code: [
      "import { Configuration, PaymentApi }",
      "  from '@yookassa/node-sdk';",
      "",
      "export async function createPayment(input) {",
      "  const api = new PaymentApi(config);",
      "  return api.createPayment({",
      "    amount: input.amount,",
      "    confirmation: input.confirmation,",
      "    receipt: input.receipt,",
      "  }, input.idempotencyKey);",
      "}",
    ],
    checks: [
      "Схема запроса",
      "Подпись уведомления",
      "Чек (54-ФЗ)",
      "Идемпотентность",
      "Ошибки интеграции",
    ],
    result: "Готово к тестированию",
  },
  validate: {
    tab: "Проверка",
    request: "Проверь JSON платежа и чека перед отправкой в тестовый магазин.",
    answer: "Сверю payload с OpenAPI и выполню технические проверки чека без обращения к API.",
    plan: [
      "Проверка обязательных полей",
      "Сверка суммы платежа и позиций",
      "Проверка форматов реквизитов",
      "Контроль ключа идемпотентности",
    ],
    code: [
      "{",
      '  "amount": { "value": "1250.00",',
      '              "currency": "RUB" },',
      '  "capture": true,',
      '  "receipt": { "items": [/* … */] }',
      "}",
    ],
    checks: [
      "OpenAPI — валидно",
      "Суммы совпадают",
      "Обязательные поля есть",
      "Идемпотентность задана",
    ],
    result: "Запрос прошел проверку",
  },
  diagnose: {
    tab: "Диагностика",
    request: "Почему тестовый платеж остался в статусе waiting_for_capture?",
    answer: "Прочитаю состояние платежа и связанные объекты. Финансовые операции выполняться не будут.",
    plan: [
      "Проверка тестового контура",
      "Чтение текущего платежа",
      "Сверка ожидаемого сценария",
      "Проверка webhook и чека",
    ],
    code: [
      "GET /v3/payments/{payment_id}",
      "",
      "test: true",
      'status: "waiting_for_capture"',
      "paid: true",
      "refundable: false",
    ],
    checks: [
      "Тестовый магазин",
      "Соединение с API",
      "Статус подтвержден",
      "Данные только для чтения",
    ],
    result: "Причина найдена",
  },
};

export const skills: SkillItem[] = [
  {
    slug: "integration-planner",
    title: "Проектирует правильную архитектуру",
    description:
      "Строит потоки оплаты, возвратов и уведомлений. Подбирает методы, статусы и обработку ошибок под ваш стек.",
  },
  {
    slug: "implementation",
    title: "Пишет готовый production-код",
    description:
      "Генерирует серверную и клиентскую части с идемпотентностью, безопасным хранением секретов и тестами.",
  },
  {
    slug: "receipts-54fz",
    title: "Проверяет запросы и чеки",
    description:
      "Сверяет payload с OpenAPI и техническими требованиями 54-ФЗ, не придумывая юридически значимые реквизиты.",
  },
  {
    slug: "integration-review",
    title: "Проверяет качество интеграции",
    description:
      "Находит риски безопасности, ошибок статусов, повторов, webhook и чеков до запуска.",
  },
  {
    slug: "diagnostics",
    title: "Диагностирует только тестовый магазин",
    description:
      "Читает статусы, ошибки и связанные объекты без изменения данных и без действий в production.",
  },
];

export const installCommands: InstallCommand[] = [
  {
    label: "Добавьте marketplace",
    command:
      "codex plugin marketplace add Belolipetsky/YooKassa-MCP --ref main",
  },
  {
    label: "Установите интеграционного агента",
    command: "codex plugin add yookassa-integration-agent@yookassa",
  },
];

export const sourceGroups: Array<{
  title: string;
  links: SourceLink[];
}> = [
  {
    title: "Документация ЮKassa",
    links: [
      {
        label: "API ЮKassa",
        description: "Методы и объекты API",
        href: "https://yookassa.ru/developers/api",
      },
      {
        label: "OpenAPI",
        description: "Машиночитаемая спецификация",
        href: "https://yookassa.ru/developers/using-api/openapi-specification",
      },
      {
        label: "Webhooks",
        description: "Входящие уведомления",
        href: "https://yookassa.ru/developers/using-api/webhooks",
      },
    ],
  },
  {
    title: "Тестирование и чеки",
    links: [
      {
        label: "Тестирование",
        description: "Сценарии тестового магазина",
        href: "https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing",
      },
      {
        label: "Чеки и 54-ФЗ",
        description: "Технические сценарии ЮKassa",
        href: "https://yookassa.ru/developers/payment-acceptance/receipts/54fz/basics",
      },
      {
        label: "54-ФЗ на сайте ФНС",
        description: "Официальный нормативный источник",
        href: "https://www.nalog.gov.ru/rn77/about_fts/docs/3909988/",
      },
    ],
  },
  {
    title: "Агентный подход",
    links: [
      {
        label: "Stripe Agents",
        description: "Agent-first инструменты",
        href: "https://docs.stripe.com/agents",
      },
      {
        label: "Stripe Skills",
        description: "Устройство agent skills",
        href: "https://docs.stripe.com/skills",
      },
      {
        label: "Stripe MCP",
        description: "Референс MCP-интерфейса",
        href: "https://docs.stripe.com/mcp",
      },
    ],
  },
];

export const repositoryUrl = "https://github.com/Belolipetsky/YooKassa-MCP";
