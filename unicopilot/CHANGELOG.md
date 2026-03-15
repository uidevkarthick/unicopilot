# Changelog

All notable changes to UniCopilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-15

### Added
- **Multi-provider support**: Ollama (local), Anthropic Claude, Google Gemini, NVIDIA NIM, and OpenAI-compatible endpoints
- **Inline completions**: Ghost-text suggestions as you type with manual trigger (`Ctrl+Alt+Space`)
- **Chat sidebar**: Full multi-turn chat with streaming responses
- **Code commands**: Explain, Fix, and Refactor selected code via right-click menu
- **Secure API key storage**: Keys stored in VS Code Secret Storage
- **Hot model switching**: Switch provider/model from status bar
- **Context tags**: Use `@selection` and `@file` in chat to include code context
- **Keyboard shortcuts**: Customizable keybindings for inline completion and chat
- **Provider wizard**: Guided setup for configuring AI providers

### Technical
- Modular provider architecture — easy to add new providers
- Fill-in-the-middle (FIM) prompt support for code completion
- SSE streaming for Claude, Gemini, and OpenAI-compatible providers
- TypeScript strict mode with comprehensive type safety

### Supported Providers
- **Ollama**: Local inference with codellama, deepseek-coder, qwen-coder models
- **Anthropic**: Claude 3.5 Sonnet, Opus, Haiku
- **Google**: Gemini 2.0 Flash, 1.5 Pro/Flash
- **NVIDIA NIM**: Llama 3.3 70B, Nemotron, Mistral Large
- **OpenAI-compatible**: Groq, Together AI, Mistral AI, LM Studio, vLLM

---

*Initial release*
