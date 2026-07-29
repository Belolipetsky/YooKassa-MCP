# YooKassa Integration Agent Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать адаптивный лендинг Codex-плагина YooKassa Integration Agent по утвержденному изображению.

**Architecture:** Отдельный Vite/React prototype размещается в `landing/`. Контент и состояния этапов описываются типизированными структурами, а секции страницы реализуются отдельными React-компонентами с общей системой CSS-токенов.

**Tech Stack:** React, TypeScript, Vite, CSS, Phosphor Icons, Vitest, Testing Library

## Global Constraints

- Визуальный источник истины: `/var/folders/q3/kff6qdtn09dd6j946v29fw7w0000gn/T/codex-clipboard-9ea1870a-966e-484a-9976-4d59abbea8e8.png`.
- Другие сгенерированные концепты не использовать.
- Диагностика описывается только как read-only и только для тестового магазина.
- Не заявлять о полном юридическом соответствии 54-ФЗ.
- Не создавать backend, auth, формы заявок или реальные API-вызовы.
- Не использовать самодельные SVG, CSS-рисунки, emoji или графические заглушки.
- Точные команды установки нельзя менять.

---

### Task 1: Bootstrap и базовая структура

**Files:**
- Create: `landing/`
- Create: `landing/src/content.ts`
- Create: `landing/src/components/`

**Interfaces:**
- Produces: `SkillItem`, `JourneyStep`, `SourceLink`, `InstallCommand` и массивы контента для UI.

- [ ] **Step 1: Инициализировать Product Design prototype**

Run:

```bash
node /Users/aleksandrbelolipeckij/.codex/plugins/cache/openai-curated-remote/product-design/0.1.52/scripts/bootstrap-prototype.mjs \
  --dest "/Users/aleksandrbelolipeckij/Documents/ИИ-агент интеграций/landing"
```

- [ ] **Step 2: Установить зависимости**

Run:

```bash
cd "/Users/aleksandrbelolipeckij/Documents/ИИ-агент интеграций/landing"
npm install --prefer-offline --no-audit --no-fund
npm install @phosphor-icons/react --save --prefer-offline --no-audit --no-fund
```

- [ ] **Step 3: Добавить типизированный контент**

В `landing/src/content.ts` определить интерфейсы и экспортировать:

```ts
export interface JourneyStep {
  id: "plan" | "implement" | "validate" | "diagnose";
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
```

- [ ] **Step 4: Проверить базовую сборку**

Run:

```bash
npm run build
```

Expected: exit code 0.

### Task 2: Hero, путь и рабочая область

**Files:**
- Create: `landing/src/components/Header.tsx`
- Create: `landing/src/components/Hero.tsx`
- Create: `landing/src/components/Journey.tsx`
- Create: `landing/src/components/WorkspaceDemo.tsx`
- Modify: `landing/src/Prototype.tsx`
- Modify: `landing/src/prototype.css`

**Interfaces:**
- Consumes: `JourneyStep[]` из `content.ts`.
- Produces: интерактивное состояние `activeStep` и рабочую hero-композицию.

- [ ] **Step 1: Написать тест выбора этапа**

Проверить, что нажатие на `Проверить` меняет активный этап и заголовок панели.

- [ ] **Step 2: Запустить тест и увидеть ожидаемое падение**

Run:

```bash
npm test -- --run
```

Expected: FAIL до реализации компонентов.

- [ ] **Step 3: Реализовать hero и переключаемый путь**

Собрать шапку, hero, четыре этапа и три части рабочей области. Стандартные иконки брать из `@phosphor-icons/react`.

- [ ] **Step 4: Сверстать desktop-композицию**

Зафиксировать общие токены:

```css
:root {
  --ink: #0a2540;
  --ink-soft: #52677d;
  --blue: #146ff5;
  --success: #16865f;
  --page: #ffffff;
  --surface: #f8fafc;
  --line: #e2e8f0;
  --max: 1200px;
}
```

- [ ] **Step 5: Запустить тесты**

Run:

```bash
npm test -- --run
```

Expected: PASS.

### Task 3: Skills, установка и источники

**Files:**
- Create: `landing/src/components/Skills.tsx`
- Create: `landing/src/components/Installation.tsx`
- Create: `landing/src/components/Sources.tsx`
- Create: `landing/src/components/Footer.tsx`
- Modify: `landing/src/Prototype.tsx`
- Modify: `landing/src/prototype.css`

**Interfaces:**
- Consumes: `SkillItem[]`, `InstallCommand[]`, `SourceLink[]`.
- Produces: полную нижнюю часть страницы и рабочие кнопки копирования.

- [ ] **Step 1: Написать тест копирования**

Проверить вызов `navigator.clipboard.writeText()` с точной командой marketplace.

- [ ] **Step 2: Запустить тест и увидеть ожидаемое падение**

Run:

```bash
npm test -- --run
```

Expected: FAIL до реализации `Installation`.

- [ ] **Step 3: Реализовать пять skills**

Показать один вертикальный список с нумерацией и тонкими разделителями.

- [ ] **Step 4: Реализовать установку**

Использовать точные команды:

```text
codex plugin marketplace add Belolipetsky/YooKassa-MCP --ref main
codex plugin add yookassa-integration-agent@yookassa
```

- [ ] **Step 5: Реализовать официальные ссылки и футер**

Добавить ссылки на ЮKassa, ФНС, Stripe и GitHub с `target="_blank"` и `rel="noreferrer"`.

- [ ] **Step 6: Запустить тесты**

Run:

```bash
npm test -- --run
```

Expected: PASS.

### Task 4: Responsive и доступность

**Files:**
- Modify: `landing/src/prototype.css`
- Modify: `landing/src/components/Header.tsx`
- Modify: `landing/src/components/Journey.tsx`
- Test: `landing/src/Prototype.test.tsx`

**Interfaces:**
- Produces: keyboard-доступный и адаптивный лендинг без горизонтального overflow.

- [ ] **Step 1: Добавить семантические landmark и accessible names**

Использовать `header`, `nav`, `main`, `section`, `footer`, корректный порядок заголовков и `aria-current` для активного этапа.

- [ ] **Step 2: Добавить responsive правила**

Breakpoints:

```css
@media (max-width: 960px) { /* tablet */ }
@media (max-width: 640px) { /* mobile */ }
```

- [ ] **Step 3: Добавить тест обязательного контента**

Проверить наличие заголовка, пяти skills, двух команд установки и предупреждения про тестовый магазин.

- [ ] **Step 4: Запустить проверки**

Run:

```bash
npm test -- --run
npm run build
npm run test:sites
```

Expected: все команды завершаются с exit code 0.

### Task 5: Браузерная проверка и Design QA

**Files:**
- Create: `design-qa.md`
- Create: `landing/artifacts/landing-desktop.png`
- Create: `landing/artifacts/landing-mobile.png`

**Interfaces:**
- Consumes: утвержденный PNG и локальный preview.
- Produces: визуально проверенный лендинг и `design-qa.md` с `final result: passed`.

- [ ] **Step 1: Запустить локальный preview**

Run:

```bash
cd "/Users/aleksandrbelolipeckij/Documents/ИИ-агент интеграций/landing"
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

- [ ] **Step 2: Проверить основные интеракции**

Проверить якоря, переключение этапов, обе кнопки копирования, GitHub и официальные ссылки.

- [ ] **Step 3: Снять desktop и mobile**

Desktop viewport: `1440 x 1200`.  
Mobile viewport: `390 x 844`.

- [ ] **Step 4: Сравнить desktop со source image**

Собрать source и implementation в один comparison input и проверить типографику, ритм, цвета, иконки и контент.

- [ ] **Step 5: Исправить P0/P1/P2 и повторить сравнение**

Повторять только до отсутствия блокирующих и значимых расхождений.

- [ ] **Step 6: Зафиксировать QA**

`design-qa.md` должен содержать пути, размеры, состояния, историю исправлений и:

```text
final result: passed
```

