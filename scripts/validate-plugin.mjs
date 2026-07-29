#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pluginRoot = join(root, "plugins", "yookassa-integration-agent");
const errors = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${path}: invalid JSON: ${error.message}`);
    return {};
  }
}

const manifest = readJson(join(pluginRoot, ".codex-plugin", "plugin.json"));
if (manifest.name !== "yookassa-integration-agent") errors.push("plugin name mismatch");
if (manifest.skills !== "./skills/") errors.push("plugin skills path mismatch");
if (manifest.mcpServers !== "./.mcp.json") errors.push("plugin MCP path mismatch");

const mcp = readJson(join(pluginRoot, ".mcp.json"));
const server = mcp.mcpServers?.yookassa_integration;
if (!server) errors.push("missing yookassa_integration MCP server");
if (server?.command !== "node") errors.push("MCP must use node");
if (server?.type !== "stdio") errors.push("MCP must use stdio");
if (JSON.stringify(server?.args) !== JSON.stringify(["./server/dist/index.js"])) {
  errors.push("MCP bundle path mismatch");
}
for (const variable of ["YOOKASSA_SHOP_ID", "YOOKASSA_SECRET_KEY"]) {
  if (!server?.env_vars?.includes(variable)) errors.push(`missing env whitelist: ${variable}`);
}

const marketplace = readJson(join(root, ".agents", "plugins", "marketplace.json"));
const entry = marketplace.plugins?.find((plugin) => plugin.name === manifest.name);
if (!entry) errors.push("plugin is absent from marketplace");
if (entry?.source?.path !== "./plugins/yookassa-integration-agent") {
  errors.push("marketplace source path mismatch");
}

const skillsRoot = join(pluginRoot, "skills");
const expectedSkills = [
  "diagnostics",
  "implementation",
  "integration-planner",
  "integration-review",
  "receipts-54fz",
];
const actualSkills = readdirSync(skillsRoot)
  .filter((name) => statSync(join(skillsRoot, name)).isDirectory())
  .sort();
if (JSON.stringify(actualSkills) !== JSON.stringify(expectedSkills)) {
  errors.push(`skill set mismatch: ${actualSkills.join(", ")}`);
}
for (const skill of expectedSkills) {
  const source = readFileSync(join(skillsRoot, skill, "SKILL.md"), "utf8");
  if (!source.startsWith("---\n")) errors.push(`${skill}: missing YAML frontmatter`);
  if (!source.includes(`name: ${skill}\n`)) errors.push(`${skill}: name mismatch`);
  if (!source.includes("description:")) errors.push(`${skill}: missing description`);
  if (source.includes("[TODO")) errors.push(`${skill}: unfilled template marker`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log("Plugin repository structure is valid.");
