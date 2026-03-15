# Changelog

All notable changes to the UniCopilot extension will be documented in this file.

## [2.0.0] - Super-Powered Edition - 2025-03-15

### 🚀 Major Features Added

#### Advanced Code Intelligence
- **Generate Unit Tests** - Automatically create comprehensive test suites with edge cases
- **Generate Documentation** - Auto-generate JSDoc, docstrings, and inline documentation
- **Security Scan** - Detect vulnerabilities (SQL injection, XSS, auth issues, hardcoded secrets, etc.)
- **Performance Optimization** - Analyze time/space complexity and suggest optimizations
- **Code Review** - Get comprehensive code reviews with actionable feedback and scoring

#### New AI Provider Support
- **OpenRouter** - Access 200+ models through a single API (Claude, GPT-4, Gemini, DeepSeek, Llama, and more)
  - Unified API for multiple providers
  - Automatic model selection and failover
  - Transparent per-model pricing
  - No rate limits

#### Enhanced Context Awareness
- **Workspace Context** (`@workspace` tag) - Include multi-file project context in chat
  - Automatically find and include relevant files
  - Project structure tree visualization
  - Configurable file patterns and limits
  - Smart context sizing (max 500KB)

- **Git Integration** (`@git` tag) - Understand code changes and history
  - Current branch information
  - Staged and unstaged changes with diffs
  - Recent commit history
  - File-level change tracking

#### Token & Cost Tracking
- **Real-time token usage statistics** - Track prompt and completion tokens
- **Cost estimation** - Approximate costs for cloud providers
- **Per-provider analytics** - Breakdown by provider and model
- **Session tracking** - See cumulative usage
- **New commands:**
  - `UniCopilot: Show Token Usage Statistics`
  - `UniCopilot: Clear Token Statistics`
  - Enhanced status bar with token counts and costs

### ✨ Improvements

- **Enhanced welcome message** - More engaging first-run experience
- **Better error messages** - More descriptive error handling
- **Improved type safety** - Fixed TypeScript strictness issues
- **Extended context menus** - All new commands available via right-click
- **Better caching** - Improved response caching for faster completions
- **Rate limiting** - Prevents API spam and improves stability

### 🏗️ Code Architecture

- New `context/` directory for workspace and git context providers
- New `features/code-intelligence.ts` for advanced commands
- New `utils/token-tracker.ts` for usage tracking
- Improved provider interface consistency
- Better separation of concerns

### 📚 Documentation

- **Completely rewritten README** - Comprehensive documentation with examples
- **Feature comparison table** - UniCopilot vs GitHub Copilot
- **Provider setup guides** - Step-by-step for each provider
- **Context tag documentation** - How to use @workspace, @git, @file, @selection
- **Command reference** - All available commands with descriptions

### 🎨 User Experience

- **Clean, minimal design** - Simple and distraction-free
- **Fast keyboard shortcuts** - Efficient workflow
- **Transparent pricing** - See token usage and costs
- **Privacy-first** - Local models fully supported
- **No vendor lock-in** - Switch providers anytime

---

## [1.0.0] - Initial Release - 2024-XX-XX

### Features

- **Inline code completions** - Ghost-text suggestions as you type
- **Manual completion trigger** - Ctrl+Alt+Space for on-demand suggestions
- **Chat sidebar** - Multi-turn conversations with streaming
- **Code commands** - Explain, Fix, Refactor selected code
- **Multi-provider support**:
  - Ollama (local, free)
  - Anthropic Claude
  - Google Gemini
  - NVIDIA NIM
  - OpenAI
  - OpenAI-compatible endpoints
- **Secure API key storage** - VS Code Secret Storage
- **Hot provider switching** - Change models without restart
- **Status bar integration** - Quick access to settings
- **Configuration wizard** - Easy first-time setup
- **Context tags in chat** - @selection and @file support

---

## Future Releases

### [2.1.0] - Enhanced Productivity (Planned)

- [ ] **Prompt Templates** - Save and reuse custom prompts
- [ ] **Code Snippet Library** - AI-powered snippet search
- [ ] **Model Comparison Mode** - A/B test different models
- [ ] **Workspace Configurations** - Project-specific settings
- [ ] **Enhanced Chat UI** - Better message formatting and history

### [2.2.0] - Advanced Features (Planned)

- [ ] **Code Diff Preview** - Visual diff for refactoring suggestions
- [ ] **Multi-file Editing** - Suggest changes across files
- [ ] **Settings Dashboard** - Visual configuration UI
- [ ] **Telemetry Dashboard** - Detailed usage analytics
- [ ] **Custom System Prompts** - Per-provider prompt customization

### [3.0.0] - VS Code Marketplace (Planned)

- [ ] **Marketplace publishing** - Official VS Code extension
- [ ] **Auto-updates** - Automatic version updates
- [ ] **Telemetry** - Optional anonymous usage statistics
- [ ] **Feedback system** - In-app feedback and bug reporting
- [ ] **Premium features** - Advanced capabilities (optional)

---

## Notes

- All major versions maintain backward compatibility
- API keys are never included in telemetry
- Local models (Ollama) remain completely free and private
- Community contributions welcome!
