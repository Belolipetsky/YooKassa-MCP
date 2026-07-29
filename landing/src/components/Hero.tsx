import {
  CalendarBlank,
  GithubLogo,
  Play,
  ShieldCheck,
} from "@phosphor-icons/react";

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-copy">
          <h1 id="hero-title">
            От первого запроса
            <br />
            до проверенной интеграции
          </h1>
          <p className="hero-lead">
            Агент работает рядом с вами в Codex и превращает требования
            <br className="desktop-only" /> в код, проверки и диагностические
            доказательства.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#installation">
              <GithubLogo aria-hidden size={18} weight="fill" />
              Установить из GitHub
            </a>
            <a className="button button-secondary" href="#how-it-works">
              <Play aria-hidden size={17} weight="fill" />
              Как это работает
            </a>
          </div>

          <div className="hero-meta" aria-label="Ключевые свойства">
            <span>
              <CalendarBlank aria-hidden size={17} />
              Источники проверены 29 июля 2026
            </span>
            <span>
              <ShieldCheck aria-hidden size={17} />
              Работает локально
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
