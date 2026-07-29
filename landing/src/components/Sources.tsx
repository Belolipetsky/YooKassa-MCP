import { ArrowSquareOut } from "@phosphor-icons/react";
import { repositoryUrl, sourceGroups } from "../content";

export function Sources() {
  return (
    <section className="sources-section" id="sources" aria-labelledby="sources-title">
      <div className="container">
        <h2 id="sources-title">Официальные источники</h2>
        <div className="source-groups">
          {sourceGroups.map((group) => (
            <div className="source-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => (
                <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                  <span>
                    <strong>{link.label}</strong>
                    <small>{link.description}</small>
                  </span>
                  <ArrowSquareOut aria-hidden size={15} />
                </a>
              ))}
            </div>
          ))}
        </div>
        <a
          className="repository-link"
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
        >
          Исходный код и инструкция в GitHub
          <ArrowSquareOut aria-hidden size={16} />
        </a>
      </div>
    </section>
  );
}
