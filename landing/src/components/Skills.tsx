import {
  ChartLineUp,
  Code,
  GitBranch,
  ListChecks,
  Receipt,
} from "@phosphor-icons/react";
import { skills } from "../content";

const icons = [GitBranch, Code, Receipt, ListChecks, ChartLineUp];

export function Skills() {
  return (
    <section className="skills-section" id="skills" aria-labelledby="skills-title">
      <div className="container narrow-container">
        <h2 id="skills-title">5 специализированных навыков</h2>
        <div className="skills-list">
          {skills.map((skill, index) => {
            const Icon = icons[index];
            return (
              <article className="skill-row" key={skill.slug}>
                <span className="skill-number">{index + 1}</span>
                <Icon className="skill-icon" aria-hidden size={25} />
                <div>
                  <strong>{skill.title}</strong>
                  <p>{skill.description}</p>
                  <code>{skill.slug}</code>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
