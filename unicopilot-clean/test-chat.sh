#!/bin/bash

# UniCopilot Chat Test Script
# Tests if Ollama and the extension setup are working

echo "═══════════════════════════════════════════════════════"
echo "  UniCopilot Chat Test"
echo "═══════════════════════════════════════════════════════"
echo ""

# Test 1: Check if Ollama is running
echo "1️⃣  Testing Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   ✅ Ollama is running"
else
    echo "   ❌ Ollama is NOT running"
    echo "   Fix: Run 'ollama serve' in a terminal"
    echo ""
    exit 1
fi
echo ""

# Test 2: List available models
echo "2️⃣  Checking available models..."
MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
if [ -z "$MODELS" ]; then
    echo "   ❌ No models found"
    echo "   Fix: Pull a model with 'ollama pull llama3.2'"
    echo ""
    exit 1
else
    echo "   ✅ Available models:"
    echo "$MODELS" | while read model; do
        echo "      - $model"
    done
fi
echo ""

# Test 3: Test chat endpoint
echo "3️⃣  Testing Ollama chat endpoint..."
FIRST_MODEL=$(echo "$MODELS" | head -1)
echo "   Using model: $FIRST_MODEL"

RESPONSE=$(curl -s http://localhost:11434/api/chat -d "{
  \"model\": \"$FIRST_MODEL\",
  \"messages\": [{\"role\": \"user\", \"content\": \"hi\"}],
  \"stream\": false
}" 2>&1)

if echo "$RESPONSE" | grep -q "message"; then
    echo "   ✅ Chat endpoint works!"
    echo "   Response preview:"
    echo "$RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4 | head -c 100
    echo "..."
else
    echo "   ❌ Chat endpoint failed"
    echo "   Error: $RESPONSE"
    echo ""
    exit 1
fi
echo ""

# Test 4: Check extension files
echo "4️⃣  Checking extension files..."
if [ -f "package.json" ] && [ -f "tsconfig.json" ]; then
    echo "   ✅ Extension files present"
else
    echo "   ❌ Extension files missing"
    echo "   Fix: Make sure you're in the unicopilot folder"
    echo ""
    exit 1
fi
echo ""

# Test 5: Check if compiled
echo "5️⃣  Checking if extension is compiled..."
if [ -d "out" ] && [ -f "out/extension.js" ]; then
    echo "   ✅ Extension compiled"
else
    echo "   ⚠️  Extension not compiled"
    echo "   Fix: Run 'npm run compile'"
    echo ""
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
echo "  ✅ All checks passed!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Open this folder in VS Code: code ."
echo "  2. Press F5 to launch Extension Development Host"
echo "  3. In new window, press Ctrl+Shift+P"
echo "  4. Type: UniCopilot: Add / Configure Provider"
echo "  5. Select: Ollama"
echo "  6. Select model: $FIRST_MODEL"
echo "  7. Press Ctrl+Alt+C to open chat"
echo "  8. Type 'hi' and press Enter"
echo "  9. You should get a response! 🎉"
echo ""
echo "If chat still doesn't work, check:"
echo "  • View → Output → UniCopilot (for logs)"
echo "  • Help → Toggle Developer Tools (for errors)"
echo ""
