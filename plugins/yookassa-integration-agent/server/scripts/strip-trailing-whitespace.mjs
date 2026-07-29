#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (!target) {
  console.error("Usage: strip-trailing-whitespace.mjs <file>");
  process.exit(2);
}

const source = readFileSync(target, "utf8");
const normalized = source.replace(/[ \t]+$/gm, "");
writeFileSync(target, normalized);
