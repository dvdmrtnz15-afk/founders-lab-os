#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    data += chunk;
  });
  process.stdin.on("end", () => resolve(data));
});

let event;
try {
  event = JSON.parse(input || "{}");
} catch {
  process.exit(0);
}

const toolName = event.tool_name;
const filePath = event.tool_input?.file_path;

if (!["Edit", "MultiEdit", "Write"].includes(toolName)) process.exit(0);
if (!filePath) process.exit(0);

const projectDir = path.resolve(
  process.env.CLAUDE_PROJECT_DIR || process.cwd(),
);
const receiptDir = path.join(projectDir, "docs", "receipts");
const receiptFile = path.join(receiptDir, "agent-edits.jsonl");

fs.mkdirSync(receiptDir, { recursive: true });

const receipt = {
  timestamp: new Date().toISOString(),
  tool: toolName,
  file: filePath,
  actor: "claude-code",
  policy: "plan-first-human-approved-edit",
  note: "File edited by Claude Code; content omitted intentionally.",
};

fs.appendFileSync(receiptFile, JSON.stringify(receipt) + "\n");

process.exit(0);
