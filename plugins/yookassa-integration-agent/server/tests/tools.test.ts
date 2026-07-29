import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { YooKassaReadOnlyClient } from "../src/client.js";
import { registerTools } from "../src/tools.js";

describe("MCP tool contract", () => {
  let server: McpServer;
  let client: Client;

  beforeEach(async () => {
    server = new McpServer({ name: "test-yookassa", version: "0.1.0" });
    registerTools(server);
    client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await Promise.all([client.close(), server.close()]);
  });

  it("exposes exactly the approved read-only tool set", async () => {
    const response = await client.listTools();
    const names = response.tools.map((tool) => tool.name).sort();
    expect(names).toEqual([
      "yookassa_api_details",
      "yookassa_api_search",
      "yookassa_diagnose_connection",
      "yookassa_explain_error",
      "yookassa_get_payment",
      "yookassa_get_payment_method",
      "yookassa_get_receipt",
      "yookassa_get_refund",
      "yookassa_list_payments",
      "yookassa_list_receipts",
      "yookassa_list_refunds",
      "yookassa_search_documentation",
      "yookassa_validate_request",
    ]);
    for (const tool of response.tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
    }
  });

  it("calls an offline documentation tool end to end", async () => {
    const result = await client.callTool({
      name: "yookassa_search_documentation",
      arguments: { query: "54-фз" },
    });
    expect(result.isError).not.toBe(true);
    expect(JSON.stringify(result.content)).toContain("ФНС");
    expect(JSON.stringify(result.content)).toContain("yookassa.ru");
  });

  it("validates a write request without making a network call", async () => {
    const result = await client.callTool({
      name: "yookassa_validate_request",
      arguments: {
        operation_id: "create_refund",
        body: { payment_id: "p-1" },
      },
    });
    expect(result.isError).not.toBe(true);
    const content = result.content as Array<{ type: string; text?: string }>;
    const first = content[0];
    expect(first?.type).toBe("text");
    const payload = JSON.parse(first?.type === "text" ? (first.text ?? "{}") : "{}") as {
      data?: { valid?: boolean; issues?: Array<{ path?: string }> };
    };
    expect(payload.data?.valid).toBe(false);
    expect(payload.data?.issues?.map((issue) => issue.path)).toContain("Idempotence-Key");
  });

  it("blocks production diagnostics without returning production object data", async () => {
    await Promise.all([client.close(), server.close()]);
    server = new McpServer({ name: "blocked-yookassa", version: "0.1.0" });
    const mockClient = {
      get: async () => ({
        items: [{
          id: "production-payment-must-not-leak",
          status: "succeeded",
          test: false,
          metadata: { private: "must-not-leak" },
        }],
      }),
    } as YooKassaReadOnlyClient;
    registerTools(server, mockClient);
    client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const result = await client.callTool({
      name: "yookassa_diagnose_connection",
      arguments: {},
    });
    const serialized = JSON.stringify(result.content);
    expect(result.isError).toBe(true);
    expect(serialized).toContain("PRODUCTION_STORE_BLOCKED");
    expect(serialized).not.toContain("production-payment-must-not-leak");
    expect(serialized).not.toContain("must-not-leak");
  });
});
