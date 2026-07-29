# YooKassa Codex Integration Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Выпустить устанавливаемый из GitHub Codex-плагин, который помогает разработчику спроектировать, реализовать и проверить интеграцию ЮKassa и безопасно диагностировать только тестовый магазин.

**Architecture:** Плагин объединяет пять русскоязычных skills и локальный stdio MCP-сервер. Сервер разделяет офлайн-инструменты документации и валидации от read-only API-инструментов, а `TestStoreGuard` запрещает возврат данных настоящего магазина, если платеж не содержит официальный признак `test=true`.

**Tech Stack:** Codex plugin manifest, MCP TypeScript SDK 1.30.0, Node.js 20+, TypeScript 6, Zod 4, Vitest 4, esbuild, GitHub Actions.

## Global Constraints

- Не выполнять POST, PUT, PATCH или DELETE к API ЮKassa.
- Не создавать платежи, подтверждения, отмены, возвраты, чеки или webhook-настройки.
- Для живой диагностики использовать только реквизиты тестового магазина.
- Не выводить `YOOKASSA_SECRET_KEY`, Basic Auth и исходные ответы с персональными данными.
- Тестовый режим подтверждать через `payment.test === true`, как указано в официальной документации ЮKassa.
- Если обнаружено `payment.test === false`, блокировать производственные данные до перезапуска MCP.
- Источник API-контракта: официальный OpenAPI ЮKassa, снимок от 2026-07-29, SHA-256 `2b33d2a20996db8adb9c531aa0c8b6bfca31cf69e99782e74229b564996579be`.
- Требования 54-ФЗ трактовать как техническую проверку; налоговые и юридические решения не выдавать за юридическое заключение.
- MCP работает только через stdio; HTTP-сервер не поднимать.
- Сборка должна создавать один исполняемый `server/dist/index.js`, которому после установки не нужен `npm install`.

---

## File Structure

- `.agents/plugins/marketplace.json` — GitHub marketplace для установки плагина.
- `plugins/yookassa-integration-agent/.codex-plugin/plugin.json` — манифест и интерфейс плагина.
- `plugins/yookassa-integration-agent/.mcp.json` — запуск локального stdio MCP и whitelist двух переменных окружения.
- `plugins/yookassa-integration-agent/server/src/catalog.ts` — каталог операций API.
- `plugins/yookassa-integration-agent/server/src/documentation.ts` — allowlist официальных документов.
- `plugins/yookassa-integration-agent/server/src/validation.ts` — офлайн-проверка будущих write-запросов.
- `plugins/yookassa-integration-agent/server/src/client.ts` — единственный сетевой клиент, поддерживающий только GET.
- `plugins/yookassa-integration-agent/server/src/safety.ts` — автомат состояний `unknown | test | production-blocked`.
- `plugins/yookassa-integration-agent/server/src/summaries.ts` — минимизация API-ответов и исключение PII.
- `plugins/yookassa-integration-agent/server/src/tools.ts` — регистрация MCP-инструментов.
- `plugins/yookassa-integration-agent/server/src/index.ts` — stdio entrypoint.
- `plugins/yookassa-integration-agent/server/tests/*.test.ts` — модульные и контрактные тесты.
- `plugins/yookassa-integration-agent/skills/*/SKILL.md` — пять рабочих процессов агента.
- `.github/workflows/ci.yml` — проверки типов, тестов, сборки, manifests и skills.
- `README.md` — установка из GitHub, настройка тестового магазина и примеры.

### Task 1: Plugin scaffold and marketplace

**Files:**
- Create: `.agents/plugins/marketplace.json`
- Create: `plugins/yookassa-integration-agent/.codex-plugin/plugin.json`
- Create: `plugins/yookassa-integration-agent/.mcp.json`
- Create: `plugins/yookassa-integration-agent/server/package.json`
- Create: `plugins/yookassa-integration-agent/server/tsconfig.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: Codex plugin manifest schema and marketplace schema.
- Produces: plugin `yookassa-integration-agent`; MCP server key `yookassa_integration`; commands `npm run build`, `npm run check`, `npm test`.

- [x] **Step 1: Generate the plugin scaffold**

Run:

```bash
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/create_basic_plugin.py" \
  yookassa-integration-agent \
  --path "$PWD/plugins" \
  --with-skills --with-assets --with-mcp --with-marketplace \
  --marketplace-path "$PWD/.agents/plugins/marketplace.json" \
  --marketplace-name yookassa \
  --install-policy AVAILABLE \
  --auth-policy ON_USE \
  --category developer-tools
```

Expected: plugin and marketplace manifests are created without validation errors.

- [x] **Step 2: Configure a local read-only stdio server**

Use this server definition:

```json
{
  "mcpServers": {
    "yookassa_integration": {
      "type": "stdio",
      "command": "node",
      "args": ["./server/dist/index.js"],
      "cwd": ".",
      "env_vars": ["YOOKASSA_SHOP_ID", "YOOKASSA_SECRET_KEY"],
      "default_tools_approval_mode": "auto"
    }
  }
}
```

Expected: there is no HTTP URL, bearer token, write approval override, or hard-coded credential.

- [ ] **Step 3: Validate the plugin and marketplace**

Run:

```bash
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py" \
  plugins/yookassa-integration-agent
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py" \
  .agents/plugins/marketplace.json
```

Expected: both commands exit with code 0.

- [ ] **Step 4: Commit the scaffold**

```bash
git add .agents/plugins/marketplace.json package.json LICENSE plugins/yookassa-integration-agent/.codex-plugin/plugin.json plugins/yookassa-integration-agent/.mcp.json plugins/yookassa-integration-agent/server/package.json plugins/yookassa-integration-agent/server/tsconfig.json
git commit -m "feat: scaffold YooKassa Codex plugin"
```

### Task 2: Offline API catalog and request validation

**Files:**
- Create: `plugins/yookassa-integration-agent/server/references/openapi-snapshot.json`
- Create: `plugins/yookassa-integration-agent/server/src/catalog.ts`
- Create: `plugins/yookassa-integration-agent/server/src/documentation.ts`
- Create: `plugins/yookassa-integration-agent/server/src/validation.ts`
- Create: `plugins/yookassa-integration-agent/server/src/explanations.ts`
- Test: `plugins/yookassa-integration-agent/server/tests/validation.test.ts`
- Test: `plugins/yookassa-integration-agent/server/tests/catalog.test.ts`

**Interfaces:**
- Consumes: `operationId: string`, `body: unknown`, optional `idempotenceKey: string`.
- Produces: `searchOperations(query): Operation[]`, `findOperation(id): Operation | undefined`, `validateRequest(operationId, body, idempotenceKey): ValidationResult`, `explainError(codeOrStatus)`.

- [ ] **Step 1: Write failing validation tests**

Create:

```ts
import { describe, expect, it } from "vitest";
import { validateRequest } from "../src/validation.js";

describe("validateRequest", () => {
  it("requires amount and a stable idempotence key for refunds", () => {
    const result = validateRequest("create_refund", { payment_id: "p-1" });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain("amount");
    expect(result.issues.map((issue) => issue.path)).toContain("Idempotence-Key");
  });

  it("accepts a minimal receipt with customer and fiscal item fields", () => {
    const result = validateRequest("create_payment", {
      amount: { value: "100.00", currency: "RUB" },
      receipt: {
        customer: { email: "buyer@example.com" },
        items: [{
          description: "Подписка",
          quantity: "1.000",
          amount: { value: "100.00", currency: "RUB" },
          vat_code: 1,
          payment_mode: "full_payment",
          payment_subject: "service"
        }]
      }
    }, "order-42-create-payment");
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and confirm the red state**

Run:

```bash
npm --prefix plugins/yookassa-integration-agent/server test -- validation.test.ts
```

Expected before implementation: FAIL because `validateRequest` or its schema is absent.

- [ ] **Step 3: Implement schemas and catalog**

Implement exact result shape:

```ts
export type ValidationResult = {
  valid: boolean;
  operation: string;
  source: string;
  issues: Array<{
    path: string;
    message: string;
    severity: "error" | "warning";
  }>;
  checks: string[];
};
```

Every POST operation must add an error when `Idempotence-Key` is missing or longer than 64 characters. `create_refund` must require `payment_id` and `amount`; receipt items must require `description`, `quantity`, `amount`, `vat_code`, `payment_mode`, and `payment_subject`.

- [ ] **Step 4: Add catalog contract tests**

Create:

```ts
import { describe, expect, it } from "vitest";
import { findOperation, operations } from "../src/catalog.js";

describe("operation catalog", () => {
  it("does not advertise a nonexistent list payment methods endpoint", () => {
    expect(findOperation("list_payment_methods")).toBeUndefined();
  });

  it("marks every POST as a write requiring idempotency", () => {
    for (const operation of operations.filter((item) => item.method === "POST")) {
      expect(operation.write).toBe(true);
      expect(operation.idempotenceKey).toBe(true);
    }
  });
});
```

- [ ] **Step 5: Run offline tests and commit**

Run:

```bash
npm --prefix plugins/yookassa-integration-agent/server test -- validation.test.ts catalog.test.ts
```

Expected: PASS.

```bash
git add plugins/yookassa-integration-agent/server/references plugins/yookassa-integration-agent/server/src/catalog.ts plugins/yookassa-integration-agent/server/src/documentation.ts plugins/yookassa-integration-agent/server/src/validation.ts plugins/yookassa-integration-agent/server/src/explanations.ts plugins/yookassa-integration-agent/server/tests
git commit -m "feat: add YooKassa API guidance and validation"
```

### Task 3: Test-store safety and read-only diagnostics

**Files:**
- Create: `plugins/yookassa-integration-agent/server/src/client.ts`
- Create: `plugins/yookassa-integration-agent/server/src/errors.ts`
- Create: `plugins/yookassa-integration-agent/server/src/safety.ts`
- Create: `plugins/yookassa-integration-agent/server/src/summaries.ts`
- Create: `plugins/yookassa-integration-agent/server/src/tools.ts`
- Create: `plugins/yookassa-integration-agent/server/src/index.ts`
- Test: `plugins/yookassa-integration-agent/server/tests/safety.test.ts`
- Test: `plugins/yookassa-integration-agent/server/tests/summaries.test.ts`
- Test: `plugins/yookassa-integration-agent/server/tests/client.test.ts`

**Interfaces:**
- Consumes: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`; predetermined GET paths only.
- Produces: `YooKassaReadOnlyClient.get(path, query)`, `TestStoreGuard.observePayment(payment)`, sanitized summaries, thirteen MCP tools.

- [ ] **Step 1: Write failing safety tests**

Create:

```ts
import { describe, expect, it } from "vitest";
import { TestStoreGuard } from "../src/safety.js";

describe("TestStoreGuard", () => {
  it("confirms a test store only from test=true", () => {
    const guard = new TestStoreGuard();
    guard.observePayment({ id: "p-1", test: true });
    expect(guard.getMode()).toBe("test");
    expect(() => guard.requireConfirmedTestStore()).not.toThrow();
  });

  it("locks the process after production data is detected", () => {
    const guard = new TestStoreGuard();
    expect(() => guard.observePayment({ id: "p-live", test: false }))
      .toThrowError(/настоящего магазина/);
    expect(guard.getMode()).toBe("production-blocked");
  });
});
```

- [ ] **Step 2: Write a client method restriction test**

The client exposes only:

```ts
class YooKassaReadOnlyClient {
  get(path: string, query?: Record<string, string | number | undefined>): Promise<Record<string, unknown>>;
}
```

Test:

```ts
import { expect, it } from "vitest";
import { YooKassaReadOnlyClient } from "../src/client.js";

it("has no mutation methods", () => {
  const client = new YooKassaReadOnlyClient() as unknown as Record<string, unknown>;
  expect(client.post).toBeUndefined();
  expect(client.put).toBeUndefined();
  expect(client.patch).toBeUndefined();
  expect(client.delete).toBeUndefined();
});
```

- [ ] **Step 3: Run tests and confirm the red state**

Run:

```bash
npm --prefix plugins/yookassa-integration-agent/server test -- safety.test.ts client.test.ts
```

Expected before implementation: FAIL because the guard or client is absent.

- [ ] **Step 4: Implement the GET-only client and guard**

The only network call is:

```ts
await fetch(`https://api.yookassa.ru/v3${path}${query}`, {
  method: "GET",
  headers: {
    Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`, "utf8").toString("base64")}`,
    Accept: "application/json",
    "User-Agent": "yookassa-codex-integration-agent/0.1.0"
  },
  signal: AbortSignal.timeout(15_000)
});
```

Never include the Authorization value, secret key, email, phone, customer object, metadata, IP address, or full card data in tool output.

- [ ] **Step 5: Register the MCP tools**

Register exactly:

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

Every tool has `readOnlyHint: true`, `destructiveHint: false`, and `idempotentHint: true`. The diagnostic tool fetches at most one payment; an empty list reports `testMode: "unconfirmed"`, `test=true` reports `testMode: "confirmed"`, and `test=false` returns `PRODUCTION_STORE_BLOCKED`.

- [ ] **Step 6: Verify tests and build**

Run:

```bash
npm --prefix plugins/yookassa-integration-agent/server run check
npm --prefix plugins/yookassa-integration-agent/server test
npm --prefix plugins/yookassa-integration-agent/server run build
node --check plugins/yookassa-integration-agent/server/dist/index.js
```

Expected: all commands exit with code 0 and `dist/index.js` begins with a Node shebang.

- [ ] **Step 7: Commit the safe MCP**

```bash
git add plugins/yookassa-integration-agent/server/src plugins/yookassa-integration-agent/server/tests plugins/yookassa-integration-agent/server/package-lock.json plugins/yookassa-integration-agent/server/dist/index.js
git commit -m "feat: add safe test-store diagnostics"
```

### Task 4: Five technical-integration skills

**Files:**
- Modify: `plugins/yookassa-integration-agent/skills/integration-planner/SKILL.md`
- Modify: `plugins/yookassa-integration-agent/skills/implementation/SKILL.md`
- Modify: `plugins/yookassa-integration-agent/skills/receipts-54fz/SKILL.md`
- Modify: `plugins/yookassa-integration-agent/skills/diagnostics/SKILL.md`
- Modify: `plugins/yookassa-integration-agent/skills/integration-review/SKILL.md`
- Create: matching `references/checklist.md` files.

**Interfaces:**
- Consumes: repository code, developer requirements, MCP tools and official documentation.
- Produces: architecture plan, implementation patches, receipt matrix, diagnostic report, severity-ranked integration review.

- [ ] **Step 1: Define exact triggers and outputs**

Use these descriptions in frontmatter:

```text
integration-planner — проектирование нового платежного сценария, статусов, webhook, идемпотентности и чеков
implementation — написание или изменение кода интеграции ЮKassa в существующем стеке
receipts-54fz — техническая проверка чеков, ФФД-полей и моментов фискализации с оговоркой о юридической проверке
diagnostics — read-only диагностика соединения, платежей, возвратов и чеков тестового магазина
integration-review — ревью кода, конфигурации, безопасности и тестов существующей интеграции
```

- [ ] **Step 2: Encode workflow gates**

Each skill must require:

```text
1. Inspect repository and identify framework before proposing code.
2. Search current YooKassa documentation and API catalog.
3. Keep write operations in application code; never ask MCP to execute them.
4. Validate request bodies offline before recommending a live test.
5. Diagnose only a test store and stop on PRODUCTION_STORE_BLOCKED.
6. Report evidence, unresolved assumptions, and exact verification commands.
```

- [ ] **Step 3: Validate every skill**

Run:

```bash
for skill in plugins/yookassa-integration-agent/skills/*; do
  python3 "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" "$skill"
done
```

Expected: five successful validations.

- [ ] **Step 4: Commit the skills**

```bash
git add plugins/yookassa-integration-agent/skills
git commit -m "feat: add YooKassa integration skills"
```

### Task 5: Documentation, CI, installation and GitHub handoff

**Files:**
- Modify: `README.md`
- Create: `docs/security-model.md`
- Create: `.github/workflows/ci.yml`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: completed plugin artifact and GitHub repository.
- Produces: reproducible install command, environment setup, CI gates, pushed branch and updated draft PR.

- [ ] **Step 1: Document installation and test-store setup**

README must include:

```bash
codex plugin marketplace add Belolipetsky/YooKassa-MCP --ref codex/yookassa-integration-plugin
codex plugin add yookassa-integration-agent@yookassa
export YOOKASSA_SHOP_ID="<идентификатор тестового магазина>"
export YOOKASSA_SECRET_KEY="<секретный ключ тестового магазина>"
```

It must explicitly say that the MCP does not create, capture, cancel or refund payments and does not replace legal or tax advice.

- [ ] **Step 2: Add CI**

Use:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: plugins/yookassa-integration-agent/server/package-lock.json
      - run: npm ci
        working-directory: plugins/yookassa-integration-agent/server
      - run: npm run check
        working-directory: plugins/yookassa-integration-agent/server
      - run: npm test
        working-directory: plugins/yookassa-integration-agent/server
      - run: npm run build
        working-directory: plugins/yookassa-integration-agent/server
      - run: git diff --exit-code -- plugins/yookassa-integration-agent/server/dist/index.js
```

- [ ] **Step 3: Run full local verification**

Run:

```bash
npm --prefix plugins/yookassa-integration-agent/server ci
npm run test:all
python3 "$HOME/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py" plugins/yookassa-integration-agent
for skill in plugins/yookassa-integration-agent/skills/*; do
  python3 "$HOME/.codex/skills/.system/skill-creator/scripts/quick_validate.py" "$skill"
done
```

Expected: all commands exit with code 0.

- [ ] **Step 4: Test installation from the local marketplace**

Run:

```bash
codex plugin marketplace add "$PWD"
codex plugin add yookassa-integration-agent@yookassa
codex plugin list
```

Expected: `yookassa-integration-agent` is listed and its five skills plus `yookassa_integration` MCP are discoverable in a new Codex task.

- [ ] **Step 5: Commit documentation and CI**

```bash
git add README.md AGENTS.md docs/security-model.md .github/workflows/ci.yml docs/superpowers/plans/2026-07-29-yookassa-codex-integration-agent.md
git commit -m "docs: add installation and security guidance"
```

- [ ] **Step 6: Push and update the draft PR**

Run:

```bash
git push origin codex/yookassa-integration-plugin
```

Update `https://github.com/Belolipetsky/YooKassa-MCP/pull/1` with:

```text
- installable Codex plugin and GitHub marketplace
- five Russian technical-integration skills
- local stdio MCP with offline OpenAPI validation
- read-only diagnostics guarded by payment.test=true
- tests, standalone bundle and GitHub Actions
```

Expected: the draft PR contains all implementation commits and CI is running.

## Self-Review Record

- Spec coverage: plugin distribution, five skills, safe MCP, official documentation, OpenAPI, 54-ФЗ, diagnostics, tests, bundle, CI and GitHub handoff each map to a task.
- Placeholder scan: every implementation step contains an exact command, interface, data shape or acceptance condition.
- Type consistency: `Operation`, `ValidationResult`, `YooKassaReadOnlyClient`, `TestStoreGuard` and tool names are consistent across tasks.
- Scope: one product subsystem is delivered — the installable technical-integration agent; financial write automation remains explicitly outside MVP.

## Execution Handoff

План сохранён в `docs/superpowers/plans/2026-07-29-yookassa-codex-integration-agent.md`. Пользователь ранее выбрал продолжение в текущей задаче, поэтому используется Inline Execution с проверками после каждого рабочего блока.
