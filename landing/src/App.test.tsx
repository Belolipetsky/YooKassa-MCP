import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("YooKassa Integration Agent landing", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("переключает демонстрацию между этапами", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: /3\. Проверить/ }));

    expect(screen.getByText("Запрос прошел проверку")).toBeInTheDocument();
    expect(
      screen.getByText(/Проверь JSON платежа и чека перед отправкой/),
    ).toBeInTheDocument();
  });

  it("копирует точную команду marketplace", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Скопировать команду: Добавьте marketplace",
      }),
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "codex plugin marketplace add Belolipetsky/YooKassa-MCP --ref main",
    );
  });

  it("показывает обязательное содержание и безопасные границы", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /От первого запроса до проверенной интеграции/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 специализированных навыков")).toBeInTheDocument();
    expect(
      screen.getByText(/Плагин не выполняет финансовые операции/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "codex plugin add yookassa-integration-agent@yookassa",
      ),
    ).toBeInTheDocument();
  });
});
