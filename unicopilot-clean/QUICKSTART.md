# 🚀 Quick Start Guide

Get UniCopilot running in 2 minutes!

---

## ⚡ Fast Setup (3 steps)

### Step 1: Install & Build
```bash
cd unicopilot
./setup.sh
```

Or manually:
```bash
npm install
npm run compile
```

### Step 2: Launch Extension
Press **F5** in VS Code to open Extension Development Host

### Step 3: Configure AI Provider

A welcome message will appear. Click "Configure Now" or:

**Keyboard:** `Ctrl+Shift+P` → Type "UniCopilot: Add" → Enter

---

## 🎯 Recommended First Setup

### Option 1: Free & Private (Recommended)

**Use Ollama (Local - No API Key Needed)**

1. Install Ollama: https://ollama.com
2. Pull a model: `ollama pull codellama` or `ollama pull qwen2.5-coder:7b`
3. In UniCopilot:
   - Select **Ollama**
   - Base URL: `http://localhost:11434` (default)
   - Choose model: `codellama` or `qwen2.5-coder:7b`
4. Done! Start coding. ✅

**Why Ollama?**
- ✅ 100% free
- ✅ 100% private (runs locally)
- ✅ No API key required
- ✅ Fast (if you have a good GPU)

### Option 2: Cloud (Most Powerful)

**Use OpenRouter (200+ Models with One Key)**

1. Get free API key: https://openrouter.ai/keys
2. In UniCopilot:
   - Select **OpenRouter**
   - Paste API key
   - Choose model (e.g., `anthropic/claude-3-5-sonnet`)
3. Done! ✅

**Why OpenRouter?**
- ✅ Access to 200+ models
- ✅ Single API key for all
- ✅ Transparent pricing
- ✅ No rate limits
- ✅ Compare models easily

---

## 💻 Your First Completion

1. Open any code file (or create new file: `test.js`)
2. Start typing:
   ```javascript
   function calculateTotal(items
   ```
3. Wait 600ms, UniCopilot suggests:
   ```javascript
   function calculateTotal(items) {
     return items.reduce((sum, item) => sum + item.price, 0);
   }
   ```
4. Press **Tab** to accept!

---

## 💬 Your First Chat

1. Press `Ctrl+Alt+C` (or `Cmd+Alt+C` on Mac)
2. Type: "Explain how async/await works in JavaScript"
3. Get instant streaming response!

---

## 🎯 Your First Advanced Command

1. Write or select some code:
   ```javascript
   function divide(a, b) {
     return a / b;
   }
   ```
2. Right-click → **UniCopilot: Generate Unit Tests**
3. Get comprehensive test suite! 🧪

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+Space` | Trigger completion |
| `Ctrl+Alt+C` | Open chat |
| `Tab` | Accept suggestion |
| `Esc` | Dismiss suggestion |

---

## 🎨 Quick Settings (Optional)

Open settings: `Ctrl+,` → Search "UniCopilot"

**Most useful settings:**
```json
{
  "unicopilot.inlineCompletionDelay": 400,  // Faster suggestions (default: 600)
  "unicopilot.temperature": 0.1,             // More deterministic (default: 0.2)
  "unicopilot.maxTokens": 1024              // Longer completions (default: 512)
}
```

---

## 🚀 Try These Next

### Context Tags in Chat
```
Explain @selection
Review @file
What changed in @git?
Analyze @workspace structure
```

### Right-Click Commands
- **Generate Documentation** - Add JSDoc/docstrings
- **Security Scan** - Find vulnerabilities  
- **Optimize Performance** - Improve code efficiency
- **Code Review** - Get detailed feedback

---

## 📊 View Your Usage

`Ctrl+Shift+P` → `UniCopilot: Show Token Usage Statistics`

See:
- Total requests
- Token usage
- Estimated costs
- Per-provider breakdown

---

## 🆘 Troubleshooting

### Completions not showing?
1. Check: Settings → `unicopilot.inlineCompletionEnabled`: `true`
2. Verify provider is configured (click status bar)
3. Check Output panel: View → Output → UniCopilot

### Chat not responding?
1. Verify API key is correct
2. Try switching models
3. Check internet connection (for cloud providers)

### Ollama not connecting?
1. Make sure Ollama is running: `ollama serve`
2. Verify URL: `http://localhost:11434`
3. Pull a model: `ollama pull codellama`

---

## 📚 Learn More

- **README.md** - Complete documentation
- **USAGE_GUIDE.md** - Detailed examples
- **CHANGELOG.md** - What's new
- **PROJECT_SUMMARY.md** - Technical overview

---

## 🎉 You're Ready!

That's it! You now have a **super-powered AI coding assistant** that:
- ✅ Works with ANY AI provider
- ✅ Runs locally for privacy
- ✅ Generates tests & docs
- ✅ Scans for security issues
- ✅ Optimizes performance
- ✅ Tracks costs
- ✅ Has NO vendor lock-in

**Happy coding! 🚀**

---

## 💡 Pro Tips

1. **Start with Ollama** (free, private) → upgrade to cloud when needed
2. **Use @selection tag** in chat for quick explanations
3. **Run Security Scan** before committing code
4. **Generate tests first** (TDD) then implement
5. **Review @git changes** before pushing

---

## 🤝 Need Help?

- **Documentation:** All .md files in this folder
- **Issues:** GitHub Issues (if available)
- **Output Logs:** View → Output → UniCopilot

---

**⬡ UniCopilot - Your code, your AI, your way.**
