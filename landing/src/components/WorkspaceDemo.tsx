import {
  CheckCircle,
  Copy,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { JourneyStepId } from "../content";
import { workspaceStates } from "../content";

interface WorkspaceDemoProps {
  activeStep: JourneyStepId;
}

export function WorkspaceDemo({ activeStep }: WorkspaceDemoProps) {
  const state = workspaceStates[activeStep];

  return (
    <section
      className="workspace-shell"
      id="workspace-panel"
      role="tabpanel"
      aria-live="polite"
    >
      <div className="container">
        <div className="workspace">
          <div className="workspace-bar">
            <strong>Codex + ЮKassa Integration Agent</strong>
            <span>
              <i aria-hidden />
              Локально
            </span>
            <div className="workspace-tabs" aria-label="Разделы рабочей области">
              <button className="is-active" type="button">
                {state.tab}
              </button>
              <button type="button">OpenAPI</button>
              <button type="button">Архитектура</button>
            </div>
          </div>

          <div className="workspace-grid">
            <div className="conversation-panel">
              <div className="message message-user">
                <span className="avatar avatar-user">Вы</span>
                <p>{state.request}</p>
              </div>
              <div className="message message-agent">
                <span className="avatar avatar-agent">AI</span>
                <p>{state.answer}</p>
              </div>
              <div className="plan">
                <strong>План решения</strong>
                <ul>
                  {state.plan.map((item) => (
                    <li key={item}>
                      <CheckCircle aria-hidden size={16} weight="fill" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="prompt-box">
                <span>Опишите задачу или вставьте OpenAPI-фрагмент…</span>
                <PaperPlaneTilt aria-hidden size={18} weight="fill" />
              </div>
            </div>

            <div className="code-panel" aria-label={`Рабочая область: ${state.tab}`}>
              <div className="panel-title">
                <strong>{state.tab}</strong>
                <span>payments.ts</span>
              </div>
              <pre>
                <code>
                  {state.code.map((line, index) => (
                    <span className="code-line" key={`${line}-${index}`}>
                      <i>{index + 1}</i>
                      {line || " "}
                    </span>
                  ))}
                </code>
              </pre>
              <div className="code-footer">
                <span>TypeScript</span>
                <button type="button" aria-label="Скопировать пример кода">
                  <Copy aria-hidden size={15} />
                  Скопировать
                </button>
              </div>
            </div>

            <div className="checks-panel">
              <strong>Результаты проверок</strong>
              <ul>
                {state.checks.map((check) => (
                  <li key={check}>
                    <CheckCircle aria-hidden size={17} weight="fill" />
                    <span>
                      {check}
                      <small>Валидно</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="success-card">
                <CheckCircle aria-hidden size={22} weight="fill" />
                <strong>{state.result}</strong>
                <p>Результат подтвержден проверками агента.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
