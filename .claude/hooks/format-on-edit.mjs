#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";

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
if (!["Edit", "MultiEdit", "Write"].includes(toolName)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const packageFile = `${projectDir}/package.json`;

if (!fs.existsSync(packageFile)) process.exit(0);

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
} catch {
  process.exit(0);
}

if (!pkg.scripts?.format) process.exit(0);

spawnSync("pnpm", ["format"], {
  cwd: projectDir,
  stdio: "inherit",
  shell: false,
});

process.exit(0);
