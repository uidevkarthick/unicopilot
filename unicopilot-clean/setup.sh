#!/bin/bash

# UniCopilot Setup Script
# Automated setup for development and installation

set -e

echo "═══════════════════════════════════════"
echo "   UniCopilot - Super-Powered Edition"
echo "═══════════════════════════════════════"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected."
    echo "   UniCopilot requires Node.js 18 or newer."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Success message
echo "═══════════════════════════════════════"
echo "   ✅ Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Press F5 in VS Code to launch Extension Development Host"
echo "  2. Configure your AI provider (Ctrl+Shift+P → UniCopilot: Add Provider)"
echo "  3. Start coding with super-powered AI assistance!"
echo ""
echo "Documentation:"
echo "  • README.md - Complete feature documentation"
echo "  • USAGE_GUIDE.md - Detailed usage instructions"
echo "  • CHANGELOG.md - Version history"
echo ""
echo "Quick commands:"
echo "  • npm run compile - Rebuild after code changes"
echo "  • npm run watch - Auto-compile on file changes"
echo "  • npm test - Run tests"
echo "  • vsce package - Build .vsix for distribution"
echo ""
echo "Happy coding! 🚀"
