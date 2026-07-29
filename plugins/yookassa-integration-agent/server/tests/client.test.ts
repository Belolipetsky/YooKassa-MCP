import { expect, it } from "vitest";
import { YooKassaReadOnlyClient } from "../src/client.js";

it("exposes no mutation methods", () => {
  const client = new YooKassaReadOnlyClient() as unknown as Record<string, unknown>;
  expect(client.post).toBeUndefined();
  expect(client.put).toBeUndefined();
  expect(client.patch).toBeUndefined();
  expect(client.delete).toBeUndefined();
});
