# Upstream

Vendored copy of the Anatomy skill.

- Source: https://github.com/wheresryan22/anatomy
- Commit: 1482e8469b0a9e0d8cc18ea2740a01423d29ae80 (2026-10-18)
- License: MIT (see `LICENSE`)

Left out of this copy: `.git`, `.github` (upstream CI, issue templates and README images), and the built example pages and PDFs under `examples/`. Rebuild an example with `node examples/<name>/build.mjs` (add `--light` for the light theme); the output is git-ignored.

Requirements: Node.js 20.10+, and Chrome or Chromium for the capture and verify scripts. In Claude Code cloud sessions, `CHROME_PATH` in `.claude/settings.json` points the scripts at the preinstalled Chromium.

`scripts/publish.mjs` pushes a figure to the upstream community gallery on GitHub. The skill runs it only when asked.

To update, replace this folder with a fresh checkout of upstream `main`, drop the same paths, and update the commit above.
