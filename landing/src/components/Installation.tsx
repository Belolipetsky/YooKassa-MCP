import { Check, Copy, Lightbulb, PlusCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { installCommands } from "../content";

export function Installation() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function copyCommand(command: string, index: number) {
    await navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1600);
  }

  return (
    <section
      className="installation-section"
      id="installation"
      aria-labelledby="installation-title"
    >
      <div className="container installation-grid">
        <div className="install-column">
          <h2 id="installation-title">Установка за 2 шага</h2>
          <p className="section-intro">
            Команды выполняются в терминале. Ключи магазина для установки не
            нужны.
          </p>

          <ol className="install-list">
            {installCommands.map((item, index) => (
              <li key={item.command}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>
                    {index === 0
                      ? "Подключает GitHub-репозиторий как marketplace."
                      : "Добавляет skills и локальный read-only MCP."}
                  </p>
                  <div className="command-row">
                    <code>{item.command}</code>
                    <button
                      type="button"
                      onClick={() => copyCommand(item.command, index)}
                      aria-label={`Скопировать команду: ${item.label}`}
                    >
                      {copiedIndex === index ? (
                        <Check aria-hidden size={18} weight="bold" />
                      ) : (
                        <Copy aria-hidden size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="new-task-note">
            <PlusCircle aria-hidden size={20} />
            <span>Откройте новую задачу Codex после установки.</span>
          </div>
        </div>

        <div className="first-prompt">
          <h2>Первый запрос</h2>
          <p>Опишите задачу — агент предложит план, код и проверки.</p>
          <div className="prompt-example">
            <span>// Пример запроса</span>
            <p>
              Нужна интеграция приема платежей картой на сайте.
              <br />
              Фронтенд: React 18
              <br />
              Бэкенд: Node.js/Express
              <br />
              Платежная система: ЮKassa (test shop)
              <br />
              <br />
              Что мне сделать?
            </p>
          </div>
          <div className="prompt-tip">
            <Lightbulb aria-hidden size={20} weight="fill" />
            <p>
              <strong>Совет:</strong> приложите фрагмент OpenAPI или ссылку на
              нужный раздел — агент учтет их в ответе.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
