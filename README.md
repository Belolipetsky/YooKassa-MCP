# ЮKassa: ИИ-агент технической интеграции для Codex

Устанавливаемый Codex-плагин, который помогает разработчику:

- спроектировать платежный flow;
- написать интеграцию под стек проекта;
- проверить запросы по OpenAPI без отправки;
- спроектировать и проверить чеки с учетом технических требований 54-ФЗ;
- провести read-only диагностику тестового магазина;
- сделать code review существующей интеграции.

Это развитие ранее созданного YooKassa MCP. MVP намеренно исключает финансовые write-инструменты: агент не создает, не подтверждает, не отменяет платежи, не делает возвраты и не меняет webhook. Такой код агент пишет и тестирует в приложении разработчика, а MCP дает документацию, офлайн-валидацию и безопасную диагностику.

## Что входит

Пять skills:

| Skill | Назначение |
|---|---|
| `integration-planner` | Архитектура, статусы, идемпотентность, webhook, чеки и тест-план |
| `implementation` | Production-код интеграции и тесты под текущий стек |
| `receipts-54fz` | Техническая проверка чеков, ФФД и маркировки |
| `diagnostics` | Диагностика только тестового магазина |
| `integration-review` | Ревью безопасности, корректности и готовности к запуску |

Тринадцать read-only MCP tools:

```text
yookassa_search_documentation
yookassa_api_search
yookassa_api_details
yookassa_validate_request
yookassa_explain_error
yookassa_diagnose_connection
yookassa_get_payment
yookassa_list_payments
yookassa_get_refund
yookassa_list_refunds
yookassa_get_receipt
yookassa_list_receipts
yookassa_get_payment_method
```

## Установка в Codex из GitHub

После merge в `main`:

```bash
codex plugin marketplace add Belolipetsky/YooKassa-MCP --ref main
codex plugin add yookassa-integration-agent@yookassa
```

Для проверки текущего draft PR:

```bash
codex plugin marketplace add Belolipetsky/YooKassa-MCP --ref codex/yookassa-integration-plugin
codex plugin add yookassa-integration-agent@yookassa
```

После установки откройте новую задачу Codex, чтобы skills и MCP появились в контексте.

## Тестовый магазин

Офлайн-поиск, проектирование и валидация работают без ключей. Для живой read-only диагностики задайте реквизиты именно тестового магазина до запуска Codex:

```bash
export YOOKASSA_SHOP_ID="<shopId тестового магазина>"
export YOOKASSA_SECRET_KEY="<secret key тестового магазина>"
codex
```

Плагин проверяет среду по официальному признаку `test=true` в объекте платежа:

- `test=true` — диагностика разрешена;
- пустой магазин — соединение подтверждено, тестовый режим еще не подтвержден;
- `test=false` — данные не возвращаются, процесс блокируется до замены реквизитов и перезапуска Codex.

Секреты не передаются в skill-промпты и не выводятся MCP-инструментами.

## Примеры запросов

```text
Спроектируй интеграцию ЮKassa для подписки в этом Next.js-проекте.
Реализуй двухстадийный платеж с идемпотентностью и webhook.
Проверь JSON платежа и чека перед тестовым запросом.
Проведи диагностику тестового магазина: почему платеж остался pending?
Проверь частичный возврат и связанный чек.
Сделай ревью интеграции ЮKassa перед запуском.
```

## Локальная разработка

```bash
cd plugins/yookassa-integration-agent/server
npm ci
npm run check
npm test
npm run build
node --check dist/index.js
```

Сборка создает один `server/dist/index.js`. Он включается в git, поэтому пользователю плагина не нужен `npm install`.

Проверка skills и manifests:

```bash
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py" \
  plugins/yookassa-integration-agent

for skill in plugins/yookassa-integration-agent/skills/*; do
  python3 "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" "$skill"
done

node scripts/validate-plugin.mjs
```

## Источники

- [API ЮKassa](https://yookassa.ru/developers/api)
- [OpenAPI ЮKassa](https://yookassa.ru/developers/using-api/openapi-specification)
- [Формат взаимодействия и идемпотентность](https://yookassa.ru/developers/using-api/interaction-format)
- [Webhook ЮKassa](https://yookassa.ru/developers/using-api/webhooks)
- [Тестирование](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing)
- [Чеки](https://yookassa.ru/developers/payment-acceptance/receipts/basics)
- [54-ФЗ через ЮKassa](https://yookassa.ru/developers/payment-acceptance/receipts/54fz/basics)
- [54-ФЗ на сайте ФНС](https://www.nalog.gov.ru/rn77/about_fts/docs/3909988/)
- [Stripe: Agents and AI](https://docs.stripe.com/agents)
- [Stripe: Agent skills](https://docs.stripe.com/skills)
- [Stripe MCP](https://docs.stripe.com/mcp)

Полный реестр источников и правила работы агента находятся в [AGENTS.md](./AGENTS.md).

## Ограничения

- Плагин не выполняет финансовые операции.
- MCP поддерживает только stdio и не поднимает HTTP-сервер.
- Каталог API — проверенная выборка из официального OpenAPI-снимка от 29 июля 2026 года; перед релизом агент обязан проверять changelog.
- Проверка чеков не заменяет консультацию юриста, бухгалтера или специалиста по ККТ.
- В тестовом режиме ЮKassa доступны не все способы оплаты настоящего магазина.

Подробная модель угроз: [docs/security-model.md](./docs/security-model.md).
