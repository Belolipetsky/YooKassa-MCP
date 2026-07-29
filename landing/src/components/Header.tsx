import { DiamondsFour, GithubLogo } from "@phosphor-icons/react";
import { repositoryUrl } from "../content";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-row">
        <a className="brand" href="#top" aria-label="ЮKassa Integration Agent — наверх">
          <DiamondsFour aria-hidden size={28} weight="fill" />
          <span className="brand-name">ЮKassa Integration Agent</span>
          <span className="brand-caption">Локальный плагин для Codex</span>
        </a>

        <nav className="main-nav" aria-label="Основная навигация">
          <a href="#skills">Возможности</a>
          <a href="#installation">Как установить</a>
          <a href="#sources">Документация</a>
          <a
            className="icon-link"
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Открыть GitHub-репозиторий"
          >
            <GithubLogo aria-hidden size={23} weight="fill" />
          </a>
        </nav>
      </div>
    </header>
  );
}
