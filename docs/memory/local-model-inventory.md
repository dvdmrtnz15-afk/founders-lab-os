# Local Model Inventory - 2026-05-25

## Machine

- MacBook Pro `Mac17,8`
- Apple M5 Pro
- 18 CPU cores
- 20 GPU cores
- 24 GB unified memory

This is a strong local-model machine, but 24 GB memory means the sweet spot is small/medium quantized models. A 12B model is reasonable for quality work; 30B+ local models are likely to be uncomfortable unless very aggressively quantized.

## Installed Local Model Runtime

### Ollama

- App installed: `/Applications/Ollama.app`
- Model store: `/Users/davidalonsomartinez/.ollama`
- Disk used: about `28G`
- Current loaded models: none

### LM Studio / Hugging Face / MLX / llama.cpp

No active local stores were found in the usual locations:

- `/Users/davidalonsomartinez/.lmstudio`
- `/Users/davidalonsomartinez/.cache/huggingface`
- `/Users/davidalonsomartinez/.cache/mlx`
- `/Users/davidalonsomartinez/.cache/llama.cpp`

## Ollama Models Installed

| Model                     |   Size | Last Modified | Best Use                                                                   |
| ------------------------- | -----: | ------------- | -------------------------------------------------------------------------- |
| `gemma3:12b`              | 8.1 GB | 2026-05-24    | Best local general quality, product thinking, architecture, longer answers |
| `qwen2.5-coder:7b`        | 4.7 GB | 2026-05-24    | Best local coding assistant                                                |
| `deepseek-r1:8b`          | 5.2 GB | 2026-05-24    | Reasoning, tradeoffs, stepwise analysis                                    |
| `gemma3:4b`               | 3.3 GB | 2026-05-24    | Fast general chat/editing                                                  |
| `qwen3:4b`                | 2.5 GB | 2026-05-24    | Quick planning, lightweight reasoning                                      |
| `phi4-mini:3.8b`          | 2.5 GB | 2026-05-24    | Compact logic, structured answers                                          |
| `llama3.2:3b`             | 2.0 GB | 2026-05-24    | Fast drafts and lightweight chat                                           |
| `qwen2.5-coder:1.5b-base` | 986 MB | 2026-05-25    | Autocomplete / quick local completions                                     |
| `nomic-embed-text:latest` | 274 MB | 2026-05-24    | Local embeddings for search/RAG/codebase indexing                          |

## VS Code AI Extensions Installed

- `continue.continue@1.2.22`
- `rooveterinaryinc.roo-cline@3.54.0`
- `anthropic.claude-code@2.1.145`
- `github.vscode-pull-request-github@0.146.0`

## Continue Configuration

Continue is already configured as `FounderLab Local Ollama` and points at the installed Ollama models.

Configured roles:

- Chat/edit/apply: `gemma3:12b`
- Chat/edit/apply: `qwen2.5-coder:7b`
- Autocomplete: `qwen2.5-coder:1.5b-base`
- Chat: `deepseek-r1:8b`
- Chat/edit: `qwen3:4b`
- Chat/edit: `gemma3:4b`
- Chat: `phi4-mini:3.8b`
- Chat: `llama3.2:3b`
- Embed: `nomic-embed-text:latest`

Important note: `.continuerc.json` currently has `"disableIndexing": true`, so Continue may not be using its local codebase index even though `nomic-embed-text` is installed.

## Recommended Local Model Routing

- Default coding: `qwen2.5-coder:7b`
- Best local product/architecture reasoning: `gemma3:12b`
- Fast everyday assistant: `gemma3:4b` or `qwen3:4b`
- Deep reasoning scratchpad: `deepseek-r1:8b`
- Autocomplete: `qwen2.5-coder:1.5b-base`
- Embeddings/search: `nomic-embed-text:latest`

## Best Plugins / Apps To Use Alongside This

### Already Installed Locally

- Continue: best pairing for local Ollama models inside VS Code.
- Roo Cline: useful as a VS Code agent shell, though no custom modes are currently configured.
- Claude Code: best for serious repo-wide edits, high-risk changes, and deployment/security-sensitive work.
- Ollama app: model runtime and simple local model manager.

### Available In This Codex Session

- Browser: test local web apps and inspect localhost pages from inside Codex.
- Chrome: use real Chrome sessions when login/cookies/extensions matter.
- Computer Use: operate local Mac apps when a task requires GUI interaction.
- Documents: create/edit/render Word documents.
- Presentations: create/render PowerPoint decks.
- Spreadsheets: create/analyze/render spreadsheets.

### Best Companion Apps To Consider

- Open WebUI: local web UI over Ollama; good for chat, prompt testing, and simple shared workspaces.
- AnythingLLM: local/private RAG over documents and folders; useful with `nomic-embed-text`.
- LM Studio: good GUI for downloading/testing GGUF models outside Ollama.
- Msty or Jan: friendly desktop local-model chat apps.
- Hugging Face CLI/cache: useful if you want direct model downloads, MLX models, or non-Ollama workflows.

## Suggested Next Tweaks

1. Turn Continue indexing back on if you want local semantic code search.
2. Add a Roo Cline custom mode that routes low-risk planning to Ollama and keeps high-risk edits on Claude Code/Codex.
3. Add one larger coding model only if you feel the current 7B model is too weak; with 24 GB memory, avoid chasing huge local models first.
4. Keep `gemma3:12b`, `qwen2.5-coder:7b`, `qwen2.5-coder:1.5b-base`, and `nomic-embed-text` as your core local set.
