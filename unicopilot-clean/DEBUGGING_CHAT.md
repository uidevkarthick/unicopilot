# 🐛 Debugging UniCopilot Chat Not Working

## Issue: Chat message not sending when typing "hi" with Ollama

Let's diagnose and fix this step by step.

---

## ✅ **Step 1: Verify Ollama is Running**

### Check if Ollama is running on your machine:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Expected output: JSON with list of models
# If error: Ollama is not running
```

### Start Ollama if not running:

```bash
# Start Ollama server
ollama serve

# In another terminal, verify it's running
ollama list
```

### Pull a model if you haven't:

```bash
# Recommended models for chat:
ollama pull llama3.2
# or
ollama pull qwen2.5:7b
# or
ollama pull codellama
```

---

## ✅ **Step 2: Check VS Code Extension Development Host**

### Open Developer Tools:

In the **Extension Development Host window** (where UniCopilot is running):

1. **Help** → **Toggle Developer Tools**
2. Go to **Console** tab
3. Look for errors when you try to send "hi"

**Common errors:**

```
❌ Failed to fetch
   → Ollama not running

❌ Model not found
   → Model not pulled in Ollama

❌ Connection refused
   → Wrong Ollama URL

❌ TypeError: Cannot read property...
   → UI JavaScript error
```

---

## ✅ **Step 3: Check Output Panel**

In the Extension Development Host:

1. **View** → **Output**
2. Select **"UniCopilot"** from dropdown
3. Type "hi" in chat
4. Check for error messages

---

## ✅ **Step 4: Verify Provider Configuration**

### Check current configuration:

1. Press `Ctrl+Shift+P`
2. Type: **"UniCopilot: Show Status"**
3. Verify:
   - Provider: `ollama`
   - Model: (should show a model name like `llama3.2`)
   - If model shows `(none)`, you need to configure

### Configure provider properly:

1. Press `Ctrl+Shift+P`
2. Type: **"UniCopilot: Add / Configure Provider"**
3. Select **Ollama**
4. Base URL: `http://localhost:11434` (default)
5. Select a model from the list
6. Try sending "hi" again

---

## ✅ **Step 5: Test Ollama Directly**

Test if Ollama works outside VS Code:

```bash
# Test chat endpoint directly
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2",
  "messages": [
    {"role": "user", "content": "hi"}
  ],
  "stream": false
}'

# Expected: JSON response with message content
```

If this works, Ollama is fine. The issue is in the extension.

---

## ✅ **Step 6: Check Chat Panel UI**

### Verify chat input is working:

1. Open chat: `Ctrl+Alt+C`
2. Type "hi" in the input box
3. **Does the input box show text?** ✅ or ❌
4. **Does the Send button (↑) light up?** ✅ or ❌
5. **Click the Send button** - what happens?

### Common UI issues:

**Issue:** Input box doesn't accept text
- **Fix:** Click inside the input box to focus it

**Issue:** Send button stays disabled
- **Fix:** Input must have text (not just whitespace)

**Issue:** Message appears but no response
- **Fix:** Check Ollama is running and model is loaded

---

## ✅ **Step 7: Rebuild Extension**

Sometimes a clean rebuild fixes issues:

```bash
# In the unicopilot folder
cd /path/to/unicopilot-clean

# Clean
rm -rf out node_modules

# Reinstall
npm install

# Recompile
npm run compile

# Restart VS Code
# Press F5 again
```

---

## ✅ **Step 8: Check Specific Errors**

### Error: "Cannot reach Ollama"

**Cause:** Ollama not running or wrong URL

**Fix:**
```bash
# Start Ollama
ollama serve

# Verify in VS Code settings
# File → Preferences → Settings → Search "unicopilot"
# Check: unicopilot.ollamaBaseUrl = "http://localhost:11434"
```

### Error: "Model not found"

**Cause:** Model not pulled in Ollama

**Fix:**
```bash
# Pull the model
ollama pull llama3.2

# Reconfigure in VS Code
# Ctrl+Shift+P → UniCopilot: Switch Model
# Select the pulled model
```

### Error: "No model selected"

**Cause:** Model not configured in extension

**Fix:**
```bash
# Configure provider
# Ctrl+Shift+P → UniCopilot: Add / Configure Provider
# Select Ollama → Select model
```

### Error: Chat just shows "..." forever

**Cause:** Streaming response stuck

**Fix:**
- Check Developer Console for errors
- Restart Ollama: `ollama serve`
- Reconfigure the model

---

## 🔍 **Advanced Debugging**

### Check network requests:

1. Open Developer Tools (in Extension Development Host)
2. Go to **Network** tab
3. Type "hi" in chat
4. Look for requests to `localhost:11434`
5. Check if request succeeds or fails

### Check webview console:

The chat panel runs in a webview. To see its console:

1. In Developer Tools, look for Console messages
2. Filter by "webview" if possible
3. Look for JavaScript errors in the chat UI

---

## 🎯 **Quick Fix Checklist**

Try these in order:

```
[ ] 1. Is Ollama running? (ollama serve)
[ ] 2. Is a model pulled? (ollama list)
[ ] 3. Can you curl Ollama? (curl http://localhost:11434/api/tags)
[ ] 4. Is provider configured? (Ctrl+Shift+P → Show Status)
[ ] 5. Is model selected? (Should not show "(none)")
[ ] 6. Does chat input accept text?
[ ] 7. Any errors in Output panel?
[ ] 8. Any errors in Developer Console?
[ ] 9. Try rebuilding: rm -rf out && npm run compile
[ ] 10. Try different model: ollama pull llama3.2:3b
```

---

## 💡 **Most Common Solution**

**99% of the time, it's one of these:**

1. **Ollama not running**
   ```bash
   ollama serve
   ```

2. **Model not selected**
   ```
   Ctrl+Shift+P → UniCopilot: Switch Model → Select a model
   ```

3. **Model not pulled**
   ```bash
   ollama pull llama3.2
   ```

---

## 📝 **Working Configuration Example**

Here's a known working setup:

```bash
# 1. Start Ollama
ollama serve

# 2. Pull model
ollama pull llama3.2:3b

# 3. Test it works
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.2:3b",
  "messages": [{"role": "user", "content": "hi"}],
  "stream": false
}'

# 4. In VS Code:
# - Press F5
# - Ctrl+Shift+P → UniCopilot: Add / Configure Provider
# - Select Ollama
# - URL: http://localhost:11434
# - Select model: llama3.2:3b
# - Press Ctrl+Alt+C to open chat
# - Type "hi" and press Enter
# - Should get response! ✅
```

---

## 🆘 **Still Not Working?**

### Share this info for more help:

1. **Ollama status:**
   ```bash
   ollama list
   curl http://localhost:11434/api/tags
   ```

2. **VS Code Output panel logs** (View → Output → UniCopilot)

3. **Developer Console errors** (Help → Toggle Developer Tools)

4. **Extension configuration:**
   ```
   Ctrl+Shift+P → UniCopilot: Show Status
   ```

5. **What happens exactly:**
   - Do you see your message appear in chat?
   - Does it show "UniCopilot is typing..."?
   - Any error message?
   - Or just nothing happens?

---

## ✅ **Expected Behavior**

When working correctly:

1. Type "hi" in chat input
2. Press Enter (or click ↑ button)
3. Your message appears: "**You:** hi"
4. Shows: "**UniCopilot** ..." (typing indicator)
5. Response streams in: "Hello! How can I help..."
6. Typing indicator disappears
7. Full response visible ✅

---

**Try the checklist above and let me know which step fails!** 🔍
