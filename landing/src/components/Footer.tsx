import { ShieldCheck } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="safety-note">
          <ShieldCheck aria-hidden size={25} />
          <p>
            Плагин не выполняет финансовые операции. Живая диагностика работает
            только с тестовым магазином. Проверка чеков не заменяет консультацию
            юриста, бухгалтера или специалиста по ККТ.
          </p>
        </div>
        <div className="footer-row">
          <span>© 2026 ЮKassa Integration Agent</span>
          <span>
            Автор решения — <strong>Александр Белолипецкий</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
