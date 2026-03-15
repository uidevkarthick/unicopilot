# ⬡ UniCopilot

**Your universal AI coding assistant for VS Code — bring your own API key.**

UniCopilot works exactly like GitHub Copilot but lets you plug in any AI provider: Ollama (local), Anthropic Claude, Google Gemini, NVIDIA NIM, or any OpenAI-compatible endpoint. Switch models in one click. No vendor lock-in, ever.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔮 **Inline Completions** | Ghost-text suggestions as you type (like real Copilot) |
| ⌨️ **Manual Trigger** | `Ctrl+Alt+Space` / `Cmd+Alt+Space` for on-demand completions |
| 💬 **Chat Sidebar** | Full multi-turn chat with streaming responses |
| 🔍 **Explain Code** | Right-click → explain selected code |
| 🐛 **Fix Code** | Right-click → auto-fix bugs in selection |
| ♻️ **Refactor Code** | Right-click → refactor for readability & performance |
| 🔌 **Multi-Provider** | Ollama, Claude, Gemini, NVIDIA NIM, any OpenAI-compatible URL |
| 🔒 **Secure Key Storage** | API keys stored in VS Code Secret Storage (never in settings files) |
| ⚡ **Hot Model Switching** | Switch provider/model anytime from the status bar |

---

## 🚀 Quick Start

### Prerequisites

- **VS Code** 1.85 or newer
- **Node.js 18+** and **npm**

### 1. Install & build

```bash
# Clone or unzip the project
cd unicopilot

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### 2. Run the extension

Press **`F5`** in VS Code with the project open — a new Extension Development Host window opens with UniCopilot active.

### 3. Configure a provider

A welcome notification will appear. Click **Configure Now**, or run:

```
Ctrl+Shift+P → UniCopilot: Add / Configure Provider
```

---

## 🔌 Provider Setup

### Ollama (Local — Free, No API Key)

1. Install Ollama: https://ollama.com
2. Pull a model: `ollama pull codellama` (or `llama3.2`, `deepseek-coder`, etc.)
3. In UniCopilot: select **Ollama** → base URL defaults to `http://localhost:11434`

**Recommended models for coding:**
- `codellama:13b` — best inline completions
- `deepseek-coder:6.7b` — fast, great quality
- `qwen2.5-coder:7b` — excellent instruction following
- `llama3.2:3b` — lightweight, fast

### Anthropic Claude

1. Get an API key: https://console.anthropic.com
2. Select **Anthropic Claude** → paste your key (stored securely)
3. Pick a model: `claude-3-5-sonnet-20241022` recommended

### Google Gemini

1. Get an API key: https://aistudio.google.com/app/apikey
2. Select **Google Gemini** → paste your key
3. Pick a model: `gemini-2.0-flash` recommended

### NVIDIA NIM

1. Get an API key: https://build.nvidia.com
2. Select **NVIDIA NIM** → paste your key
3. Pick a model: `meta/llama-3.3-70b-instruct` recommended

### Custom / OpenAI-Compatible

Works with: **OpenAI**, **Groq**, **Together AI**, **Mistral AI**, **LM Studio**, **text-generation-webui**, **vLLM**, **llama.cpp server**, and any other OpenAI-spec endpoint.

1. Select **Custom (OpenAI-Compatible)**
2. Enter your base URL, e.g.:
   - Groq: `https://api.groq.com/openai/v1`
   - Together AI: `https://api.together.xyz/v1`
   - LM Studio (local): `http://localhost:1234/v1`
   - Mistral: `https://api.mistral.ai/v1`
3. Enter your API key (leave blank for local servers)

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+Space` / `Cmd+Alt+Space` | Trigger inline completion manually |
| `Ctrl+Alt+C` / `Cmd+Alt+C` | Open chat sidebar |
| `Tab` | Accept inline suggestion |
| `Esc` | Dismiss inline suggestion |

---

## 💬 Chat: Context Tags

In the chat sidebar, use these tags to include your code as context:

| Tag | What it includes |
|---|---|
| `@selection` | The currently selected code in the editor |
| `@file` | The entire active file |

**Examples:**
```
Explain @selection
What bugs do you see in @file?
Write unit tests for @selection
Refactor @selection to use async/await
```

---

## ⚙️ Settings Reference

All settings are under `unicopilot.*` in VS Code settings (`Ctrl+,`):

| Setting | Default | Description |
|---|---|---|
| `activeProvider` | `ollama` | Active AI provider |
| `activeModel` | `""` | Active model name |
| `ollamaBaseUrl` | `http://localhost:11434` | Ollama server URL |
| `customProviderBaseUrl` | `""` | Custom OpenAI-compatible URL |
| `inlineCompletionEnabled` | `true` | Enable ghost-text completions |
| `inlineCompletionDelay` | `600` | Debounce delay (ms) |
| `maxTokens` | `512` | Max tokens for inline completions |
| `chatMaxTokens` | `4096` | Max tokens for chat |
| `temperature` | `0.2` | Sampling temperature (0–2) |
| `contextLines` | `50` | Lines of context sent with completions |

---

## 🏗️ Project Structure

```
unicopilot/
├── src/
│   ├── extension.ts                 ← Entry point
│   ├── providers/
│   │   ├── base.ts                  ← AIProvider interface
│   │   ├── anthropic.ts             ← Claude
│   │   ├── gemini.ts                ← Gemini
│   │   ├── ollama.ts                ← Ollama (local)
│   │   ├── nvidia-nim.ts            ← NVIDIA NIM
│   │   ├── openai-compat.ts         ← Any OpenAI-compatible URL
│   │   └── registry.ts             ← Runtime provider switching
│   ├── features/
│   │   ├── inline-completion.ts     ← Ghost-text completions
│   │   ├── commands.ts              ← Explain / Fix / Refactor
│   │   ├── chat-panel.ts            ← Sidebar chat webview
│   │   └── status-bar.ts           ← Status bar item
│   └── test/
│       ├── runTests.ts
│       └── suite/
│           ├── index.ts
│           └── providers.test.ts    ← Unit tests
├── assets/
│   └── sidebar-icon.svg
├── .vscode/
│   ├── launch.json                  ← F5 run config
│   ├── tasks.json                   ← Build tasks
│   └── extensions.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Adding a New Provider

UniCopilot is built to be extended. To add a new provider (e.g. Mistral, Cohere):

1. Create `src/providers/mistral.ts` — implement the `AIProvider` interface from `base.ts`
2. In `registry.ts` — add one line: `['mistral', new MistralProvider()]`
3. In `package.json` — add `mistral` to the `activeProvider` enum

That's it. No other changes needed.

---

## 📦 Package as VSIX (for sharing/installing)

```bash
npm install -g @vscode/vsce
vsce package
# Produces: unicopilot-1.0.0.vsix

# Install it:
code --install-extension unicopilot-1.0.0.vsix
```

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover: provider interface contracts, FIM prompt building, completion cleaning, URL resolution, and API key validation.

---

## 🛣️ Roadmap

- [ ] OpenAI provider (native)
- [ ] Cohere / Mistral providers
- [ ] Multi-file context (workspace-aware)
- [ ] Prompt templates (custom system prompts per provider)
- [ ] Token usage tracking in status bar
- [ ] VS Code Marketplace publishing

---

## 📄 License

MIT — use, modify, and distribute freely.
