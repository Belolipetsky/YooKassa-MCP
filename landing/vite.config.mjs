import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  resolve: {
    alias:
      mode === "test"
        ? {
            "@phosphor-icons/react": fileURLToPath(
              new URL("./src/icon-test-mock.tsx", import.meta.url),
            ),
          }
        : {},
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    include: ["src/**/*.test.tsx"],
  },
  plugins: [react()],
}));
