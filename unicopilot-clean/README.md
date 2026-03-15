# ⬡ UniCopilot - Super-Powered Edition

**Your universal AI coding assistant for VS Code — supercharged with advanced intelligence.**

UniCopilot is a next-generation AI coding assistant that works like GitHub Copilot but gives you complete control. Use any AI provider with your own API key: Ollama (local), Anthropic Claude, Google Gemini, OpenAI, OpenRouter (200+ models), NVIDIA NIM, or any OpenAI-compatible endpoint. **No vendor lock-in, ever.**

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🔮 **Inline Completions** | Ghost-text suggestions as you type (like GitHub Copilot) |
| ⌨️ **Manual Trigger** | `Ctrl+Alt+Space` / `Cmd+Alt+Space` for on-demand completions |
| 💬 **Chat Sidebar** | Full multi-turn chat with streaming responses & context tags |
| 🔍 **Explain Code** | Right-click → explain selected code |
| 🐛 **Fix Code** | Right-click → auto-fix bugs in selection |
| ♻️ **Refactor Code** | Right-click → refactor for readability & performance |
| 🔌 **Multi-Provider** | Ollama, Claude, Gemini, OpenRouter, NVIDIA NIM, OpenAI, custom endpoints |
| 🔒 **Secure Storage** | API keys stored in VS Code Secret Storage (never in files) |
| ⚡ **Hot Switching** | Switch provider/model anytime from status bar |

## 🚀 Super Powers (New!)

### 🧠 Advanced Code Intelligence

| Command | Description |
|---|---|
| 🧪 **Generate Unit Tests** | Create comprehensive test suites with edge cases |
| 📚 **Generate Documentation** | Auto-generate JSDoc, docstrings, and code comments |
| 🛡️ **Security Scan** | Detect vulnerabilities (SQL injection, XSS, auth issues, etc.) |
| 🚀 **Performance Optimization** | Analyze complexity and optimize bottlenecks |
| ⭐ **Code Review** | Get a comprehensive review with actionable feedback |

### 📊 Enhanced Context Awareness

- **@workspace** tag in chat — Include multi-file project context
- **@git** tag in chat — Understand recent changes and commit history
- **@file** tag — Include specific file content
- **@selection** tag — Reference currently selected code

### 📈 Token & Cost Tracking

- Real-time token usage statistics
- Estimated cost per provider/model
- Session analytics
- Per-request breakdown

### 🔥 Provider Support

| Provider | Local/Cloud | Notes |
|---|---|---|
| **Ollama** | Local | Free, no API key needed — best for privacy |
| **OpenRouter** | Cloud | 200+ models via single API (NEW!) |
| **Anthropic Claude** | Cloud | claude-3.5-sonnet, claude-3-opus, claude-3-haiku |
| **Google Gemini** | Cloud | gemini-2.0-flash, gemini-1.5-pro |
| **OpenAI** | Cloud | GPT-4, GPT-4o, GPT-4o-mini, o1 |
| **NVIDIA NIM** | Cloud | Meta Llama 3.3 70B, Mistral, and more |
| **Custom (OpenAI-compatible)** | Both | Groq, Together AI, LM Studio, vLLM, llama.cpp |

---

## 🚀 Quick Start

### Prerequisites

- **VS Code** 1.85 or newer
- **Node.js 18+** and **npm**

### 1. Install & Build

```bash
# Clone or unzip the project
cd unicopilot

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### 2. Run the Extension

Press **`F5`** in VS Code with the project open — a new Extension Development Host window opens with UniCopilot active.

### 3. Configure a Provider

A welcome notification will appear. Click **Configure Now**, or run:

```
Ctrl+Shift+P → UniCopilot: Add / Configure Provider
```

---

## 🔌 Provider Setup

### Ollama (Local — Free, No API Key Required)

1. Install Ollama: https://ollama.com
2. Pull a model: `ollama pull codellama` (or `llama3.2`, `deepseek-coder`, `qwen2.5-coder`)
3. In UniCopilot: select **Ollama** → base URL defaults to `http://localhost:11434`

**Recommended models for coding:**
- `codellama:13b` — best inline completions
- `deepseek-coder:6.7b` — fast, great quality
- `qwen2.5-coder:7b` — excellent instruction following
- `llama3.2:3b` — lightweight, fast

### OpenRouter (200+ Models via Single API) 🆕

1. Get an API key: https://openrouter.ai/keys
2. Select **OpenRouter** → paste your key (stored securely)
3. Pick any model: Claude, GPT-4, Gemini, DeepSeek, Llama, and 190+ more!

**Why OpenRouter?**
- Access to 200+ models with one API key
- Automatic failover and load balancing
- Transparent pricing per model
- No rate limits

### Anthropic Claude

1. Get an API key: https://console.anthropic.com
2. Select **Anthropic Claude** → paste your key
3. Pick a model: `claude-3-5-sonnet-20241022` recommended

### Google Gemini

1. Get an API key: https://aistudio.google.com/app/apikey
2. Select **Google Gemini** → paste your key
3. Pick a model: `gemini-2.0-flash` recommended

### NVIDIA NIM

1. Get an API key: https://build.nvidia.com
2. Select **NVIDIA NIM** → paste your key
3. Pick a model: `meta/llama-3.3-70b-instruct` recommended

### OpenAI

1. Get an API key: https://platform.openai.com/api-keys
2. Select **OpenAI** → paste your key
3. Pick a model: `gpt-4o`, `gpt-4o-mini`, or `o1-preview`

### Custom (OpenAI-Compatible)

Works with: **Groq**, **Together AI**, **Mistral AI**, **LM Studio**, **text-generation-webui**, **vLLM**, **llama.cpp server**

1. Select **Custom (OpenAI-Compatible)**
2. Enter your base URL:
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

## 💬 Chat Context Tags

Use these tags in the chat sidebar to include code context:

| Tag | What it includes |
|---|---|
| `@selection` | The currently selected code in the editor |
| `@file` | The entire active file |
| `@workspace` | Multi-file project context (up to 20 files) |
| `@git` | Recent git changes and commit history |

**Examples:**
```
Explain @selection
What bugs do you see in @file?
Generate unit tests for @selection
Review @workspace and suggest improvements
What changed in @git?
```

---

## 🎯 Right-Click Commands

Select code and right-click to access:

### Basic Commands
- **Explain Code** — Clear explanation of what the code does
- **Fix Code** — Identify and fix bugs
- **Refactor Code** — Improve readability and performance

### Advanced Intelligence 🆕
- **Generate Unit Tests** — Create comprehensive test suites
- **Generate Documentation** — Add JSDoc/docstrings
- **Security Scan** — Detect vulnerabilities
- **Optimize Performance** — Improve efficiency
- **Review Code** — Get detailed feedback

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

## 📊 Token Usage & Cost Tracking 🆕

UniCopilot tracks your token usage and estimates costs across all providers:

**Commands:**
- `UniCopilot: Show Token Usage Statistics` — View detailed stats
- `UniCopilot: Clear Token Statistics` — Reset counters
- `UniCopilot: Show Status` — Quick status with token count

**Features:**
- Real-time token tracking
- Per-provider cost estimation
- Session-based analytics
- Local models show $0.00 cost

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
│   │   ├── openai.ts                ← OpenAI
│   │   ├── openrouter.ts            ← OpenRouter (NEW!)
│   │   ├── openai-compat.ts         ← Any OpenAI-compatible URL
│   │   └── registry.ts              ← Runtime provider switching
│   ├── features/
│   │   ├── inline-completion.ts     ← Ghost-text completions
│   │   ├── commands.ts              ← Explain / Fix / Refactor
│   │   ├── code-intelligence.ts     ← Advanced features (NEW!)
│   │   ├── chat-panel.ts            ← Sidebar chat webview
│   │   └── status-bar.ts            ← Status bar item
│   ├── context/
│   │   ├── workspace-context.ts     ← Multi-file context (NEW!)
│   │   └── git-context.ts           ← Git integration (NEW!)
│   ├── utils/
│   │   ├── token-tracker.ts         ← Token tracking (NEW!)
│   │   ├── cache.ts                 ← Response caching
│   │   └── rate-limiter.ts          ← Request rate limiting
│   └── test/
│       └── suite/
│           └── providers.test.ts    ← Unit tests
├── assets/
│   └── sidebar-icon.svg
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Adding a New Provider

UniCopilot is built to be extended:

1. Create `src/providers/newprovider.ts` — implement `AIProvider` interface
2. In `registry.ts` — add one line: `['newprovider', new NewProvider()]`
3. In `package.json` — add `newprovider` to the `activeProvider` enum

Done. No other changes needed.

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

## 🎨 Design Philosophy

**Simple. Minimal. Powerful.**

- Clean, distraction-free UI
- Fast keyboard-driven workflow
- Transparent token usage
- No lock-in, ever
- Privacy-first (local models supported)
- Extensible architecture

---

## 🛣️ Roadmap

### Completed ✅
- ✅ OpenRouter provider (200+ models)
- ✅ Token usage tracking & cost estimation
- ✅ Advanced code intelligence (tests, docs, security, performance, review)
- ✅ Multi-file workspace context (@workspace tag)
- ✅ Git integration (@git tag)
- ✅ Enhanced status bar with token stats

### Coming Soon 🚧
- [ ] Prompt templates (save & reuse prompts)
- [ ] Code snippet library with AI search
- [ ] Model comparison mode (A/B testing)
- [ ] Code diff preview for refactoring
- [ ] Settings dashboard (visual UI)
- [ ] VS Code Marketplace publishing
- [ ] Multi-file editing suggestions
- [ ] Workspace-specific configurations

---

## 💡 Why UniCopilot?

| Feature | UniCopilot | GitHub Copilot |
|---|:---:|:---:|
| **Choose your own AI** | ✅ | ❌ |
| **Local models (privacy)** | ✅ | ❌ |
| **No subscription required** | ✅ | ❌ |
| **200+ models via OpenRouter** | ✅ | ❌ |
| **Token & cost tracking** | ✅ | ❌ |
| **Advanced code intelligence** | ✅ | ❌ |
| **Security scanning** | ✅ | ❌ |
| **Performance optimization** | ✅ | ❌ |
| **Git-aware context** | ✅ | ❌ |
| **Multi-file workspace context** | ✅ | ❌ |
| **Open source** | ✅ | ❌ |

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- Adding new providers
- Improving code intelligence features
- Enhancing UI/UX
- Writing tests
- Improving documentation

---

## 📄 License

MIT — use, modify, and distribute freely.

---

## 🙏 Credits

Built with ❤️ by the open-source community.

Powered by: VS Code Extension API, TypeScript, and the amazing AI providers.

---

## 📞 Support

- **Issues:** https://github.com/unicopilot/unicopilot/issues
- **Discussions:** https://github.com/unicopilot/unicopilot/discussions

---

**⬡ UniCopilot — Your code, your AI, your way. 🚀**
