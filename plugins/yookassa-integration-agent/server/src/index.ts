#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "yookassa-integration-agent",
    version: "0.1.0",
  });
  registerTools(server);
  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("YooKassa integration MCP started on stdio (read-only, test-store guard enabled)");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`YooKassa integration MCP failed: ${message}`);
  process.exitCode = 1;
});
