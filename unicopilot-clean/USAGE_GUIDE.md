# 📖 UniCopilot Usage Guide

Complete guide to using UniCopilot's super-powered features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Inline Completions](#inline-completions)
3. [Chat Sidebar](#chat-sidebar)
4. [Context Tags](#context-tags)
5. [Code Intelligence](#code-intelligence)
6. [Right-Click Commands](#right-click-commands)
7. [Provider Management](#provider-management)
8. [Token & Cost Tracking](#token--cost-tracking)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First-Time Setup

1. **Install the extension** (press F5 in development mode)
2. **Configure a provider** - You'll see a welcome notification
   - Click "Configure Now" or use `Ctrl+Shift+P` → `UniCopilot: Add / Configure Provider`
3. **Choose your AI provider** - Ollama (free), OpenRouter, Claude, Gemini, OpenAI, etc.
4. **Enter API key** (if required) - Stored securely in VS Code
5. **Select a model** - Choose from available models
6. **Start coding!** - UniCopilot is now active

---

## Inline Completions

### Automatic Completions

UniCopilot provides ghost-text suggestions as you type, similar to GitHub Copilot.

**How it works:**
- Start typing code
- After 600ms (configurable), UniCopilot suggests a completion
- Press **Tab** to accept
- Press **Esc** to dismiss
- Keep typing to refine

**Example:**
```javascript
// Type this:
function calculateTotal(items

// UniCopilot suggests:
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Manual Trigger

Don't want to wait? Trigger completions manually:

- **Windows/Linux:** `Ctrl+Alt+Space`
- **macOS:** `Cmd+Alt+Space`

### Configuration

Adjust completion behavior in settings:

```json
{
  "unicopilot.inlineCompletionEnabled": true,
  "unicopilot.inlineCompletionDelay": 600,  // ms before showing suggestion
  "unicopilot.maxTokens": 512,               // max completion length
  "unicopilot.temperature": 0.2,             // 0 = deterministic, 2 = creative
  "unicopilot.contextLines": 50              // lines before/after cursor
}
```

---

## Chat Sidebar

### Opening the Chat

- **Keyboard:** `Ctrl+Alt+C` / `Cmd+Alt+C`
- **Command Palette:** `UniCopilot: Open Chat`
- **Activity Bar:** Click the UniCopilot icon

### Using the Chat

Ask questions, get explanations, or request code:

```
User: How do I connect to MongoDB in Node.js?

UniCopilot: Here's how to connect to MongoDB using the official driver...
```

### Streaming Responses

Responses stream in real-time for faster feedback.

---

## Context Tags

Enhance your chat with code context using special tags.

### @selection

Include currently selected code:

```
User: Explain @selection

UniCopilot: This code defines a React component that fetches user data...
```

**Use cases:**
- Understanding unfamiliar code
- Getting inline documentation
- Finding bugs

### @file

Include the entire active file:

```
User: What bugs exist in @file?

UniCopilot: Analyzing your file, I found:
1. Missing null check on line 23...
2. Potential memory leak in useEffect...
```

**Use cases:**
- File-level analysis
- Comprehensive reviews
- Refactoring suggestions

### @workspace

Include multi-file project context (up to 20 files):

```
User: Explain the architecture of @workspace

UniCopilot: Your project follows a typical MERN stack structure:
- Backend: Express.js API in /server
- Frontend: React app in /client
- Database: MongoDB schemas in /models
...
```

**Use cases:**
- Understanding project structure
- Cross-file refactoring
- Architectural questions

### @git

Include recent git changes and commits:

```
User: Review the changes in @git

UniCopilot: Looking at your recent changes:
1. Added authentication middleware (auth.js)
   - Looks good, but consider...
2. Modified user routes
   - Security concern: missing input validation...
```

**Use cases:**
- Code review before committing
- Understanding recent changes
- Finding regressions

### Combining Tags

You can use multiple tags in one message:

```
User: Based on @git changes and @workspace structure, suggest improvements for @selection
```

---

## Code Intelligence

### Generate Unit Tests

**Command:** `UniCopilot: Generate Unit Tests`

1. Select code (function, class, or module)
2. Right-click → **UniCopilot: Generate Unit Tests**
3. Get comprehensive test suite with:
   - Happy path tests
   - Edge cases
   - Error scenarios
   - Mocking examples

**Example:**

```javascript
// Selected code:
function divide(a, b) {
  return a / b;
}

// Generated tests:
describe('divide', () => {
  test('divides two positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  test('handles division by zero', () => {
    expect(divide(10, 0)).toBe(Infinity);
  });

  test('handles negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  test('handles floating point division', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
```

### Generate Documentation

**Command:** `UniCopilot: Generate Documentation`

1. Select code
2. Right-click → **UniCopilot: Generate Documentation**
3. Get formatted documentation:
   - JSDoc for JavaScript/TypeScript
   - Docstrings for Python
   - XML comments for C#
   - Usage examples

**Example:**

```javascript
// Before:
function fetchUserData(userId, options) {
  // implementation...
}

// After:
/**
 * Fetches user data from the API.
 * 
 * @param {string} userId - The unique identifier for the user
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeProfile - Include full profile data
 * @param {boolean} options.cached - Use cached data if available
 * @returns {Promise<User>} The user object
 * @throws {Error} If userId is invalid or API request fails
 * 
 * @example
 * const user = await fetchUserData('123', { includeProfile: true });
 */
function fetchUserData(userId, options) {
  // implementation...
}
```

### Security Scan

**Command:** `UniCopilot: Security Scan`

1. Select code (or entire file)
2. Right-click → **UniCopilot: Security Scan**
3. Get security analysis:
   - Vulnerabilities found
   - Severity ratings
   - Specific fixes

**Example Output:**

```
Security Analysis Results:

🔴 CRITICAL: SQL Injection Vulnerability (Line 45)
Issue: User input directly concatenated into SQL query
Fix: Use parameterized queries:
  db.query('SELECT * FROM users WHERE id = ?', [userId])

🟠 HIGH: Hardcoded API Key (Line 12)
Issue: API key exposed in source code
Fix: Move to environment variables:
  const apiKey = process.env.API_KEY

🟡 MEDIUM: Missing Input Validation (Line 23)
Issue: User input not validated before use
Fix: Add validation:
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid email');
  }
```

### Performance Optimization

**Command:** `UniCopilot: Optimize Performance`

1. Select code
2. Right-click → **UniCopilot: Optimize Performance**
3. Get optimization suggestions:
   - Time complexity analysis
   - Memory usage improvements
   - Algorithmic optimizations

**Example:**

```javascript
// Before (O(n²)):
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// After (O(n)):
function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();
  
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  
  return Array.from(duplicates);
}

// Improvement: O(n²) → O(n) time complexity
// Memory: O(n) space for better performance
```

### Code Review

**Command:** `UniCopilot: Review Code`

1. Select code
2. Right-click → **UniCopilot: Review Code**
3. Get comprehensive review:
   - Code quality assessment
   - Best practice violations
   - Suggestions with examples
   - Overall score (1-10)

**Example Output:**

```
Code Review Results:

✅ STRENGTHS:
- Clear function names and good structure
- Proper error handling with try/catch
- Good use of async/await

⚠️ ISSUES:

HIGH: Missing Type Annotations
Location: Lines 10-25
Issue: Functions lack TypeScript types
Fix: Add type annotations:
  function processData(data: UserData[]): Promise<ProcessedData[]>

MEDIUM: Nested Callbacks
Location: Lines 45-60
Issue: Callback hell makes code hard to read
Fix: Use async/await or Promise.all()

LOW: Magic Numbers
Location: Line 78
Issue: Hardcoded value 86400000
Fix: Use named constant:
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

💡 SUGGESTIONS:
1. Consider using a validation library (Zod, Yup)
2. Extract repeated logic into helper functions
3. Add JSDoc comments for public APIs

⭐ OVERALL SCORE: 7/10
Good code with room for improvement in type safety and maintainability.
```

---

## Right-Click Commands

### Quick Commands

Select code and right-click to access:

1. **UniCopilot: Explain Selected Code**
   - Get a clear explanation

2. **UniCopilot: Fix Selected Code**
   - Identify and fix bugs

3. **UniCopilot: Refactor Selected Code**
   - Improve readability and performance

### Advanced Commands

4. **UniCopilot: Generate Unit Tests**
   - Create test suites

5. **UniCopilot: Generate Documentation**
   - Add JSDoc/docstrings

6. **UniCopilot: Security Scan**
   - Find vulnerabilities

7. **UniCopilot: Optimize Performance**
   - Improve efficiency

8. **UniCopilot: Review Code**
   - Comprehensive analysis

---

## Provider Management

### Adding a Provider

1. `Ctrl+Shift+P` → `UniCopilot: Add / Configure Provider`
2. Select provider from list
3. Enter API key (if required)
4. Select model
5. Confirm configuration

### Switching Models

1. `Ctrl+Shift+P` → `UniCopilot: Switch Model`
2. Select from available models
3. Model changes immediately

### Switching Providers

To use a different provider:

1. `Ctrl+Shift+P` → `UniCopilot: Add / Configure Provider`
2. Select new provider
3. Configure as needed

### Status Bar

Click the UniCopilot status bar item to see:
- Active provider
- Current model
- Inline completion status
- Token usage
- Estimated cost

---

## Token & Cost Tracking

### Viewing Statistics

**Command:** `UniCopilot: Show Token Usage Statistics`

Shows detailed breakdown:
- Total requests
- Prompt tokens
- Completion tokens
- Total tokens
- Estimated cost

### Quick Status

**Command:** `UniCopilot: Show Status`

Shows inline notification with summary.

### Clearing Stats

**Command:** `UniCopilot: Clear Token Statistics`

Resets all counters to zero.

### Understanding Costs

- **Local models (Ollama):** $0.00 (completely free)
- **Cloud models:** Costs vary by provider and model
- **Estimates:** Based on approximate pricing per 1M tokens
- **Real-time:** Token tracking happens during each request

**Cost Comparison (per 1M tokens):**
- GPT-4o-mini: ~$0.15 prompt, $0.60 completion
- Claude 3 Haiku: ~$0.25 prompt, $1.25 completion
- Gemini 2.0 Flash: ~$0.075 prompt, $0.30 completion

---

## Keyboard Shortcuts

### Default Shortcuts

| Shortcut | Command |
|---|---|
| `Ctrl+Alt+Space` / `Cmd+Alt+Space` | Trigger inline completion |
| `Ctrl+Alt+C` / `Cmd+Alt+C` | Open chat sidebar |
| `Tab` | Accept inline suggestion |
| `Esc` | Dismiss inline suggestion |

### Custom Shortcuts

You can customize any shortcut:

1. `File` → `Preferences` → `Keyboard Shortcuts`
2. Search for "UniCopilot"
3. Click pencil icon to change

---

## Tips & Best Practices

### For Best Completions

1. **Provide context** - Write descriptive comments and function names
2. **Be specific** - Clear variable names help AI understand intent
3. **Use types** - TypeScript types improve suggestions
4. **Keep files focused** - Smaller, focused files get better context

### For Chat

1. **Be specific** - "Explain this authentication flow" beats "what does this do"
2. **Use context tags** - @selection, @file, @workspace, @git
3. **Ask follow-ups** - Chat maintains conversation history
4. **Provide examples** - Show what you want: "like X but for Y"

### For Code Intelligence

1. **Select relevant code** - Don't include unrelated code
2. **Review suggestions** - AI is helpful but not perfect
3. **Iterate** - Run commands multiple times for different perspectives
4. **Combine approaches** - Use review + security scan together

### For Performance

1. **Use local models** - Ollama for instant, free completions
2. **Adjust context size** - Reduce `contextLines` for faster responses
3. **Cache friendly** - Similar code reuses cached responses
4. **Pick right model** - Smaller models for simple tasks, larger for complex

### For Privacy

1. **Use Ollama** - 100% local, no data sent to cloud
2. **Review prompts** - Know what context is sent to AI
3. **Avoid sensitive data** - Don't select code with secrets
4. **Self-hosted options** - Use LM Studio, vLLM, or llama.cpp

### For Cost Savings

1. **Start with free models** - Ollama, then upgrade if needed
2. **Use smaller models** - GPT-4o-mini, Claude 3 Haiku for simple tasks
3. **Limit context** - Reduce `contextLines` and `maxTokens`
4. **Monitor usage** - Check token statistics regularly
5. **OpenRouter** - Compare model costs and switch as needed

---

## Troubleshooting

### Completions Not Showing

1. Check inline completions are enabled:
   - Settings → `unicopilot.inlineCompletionEnabled`: true
2. Verify provider is configured
3. Check API key is valid
4. Look for errors in Output panel (View → Output → UniCopilot)

### Chat Not Working

1. Verify provider and model are selected
2. Check API key permissions
3. Try switching models
4. Check internet connection (for cloud providers)

### Slow Responses

1. Try a faster model (GPT-4o-mini, Gemini Flash, Claude Haiku)
2. Reduce context size (`contextLines`)
3. Use local model (Ollama)
4. Check your internet speed (for cloud models)

### High Costs

1. Switch to smaller models
2. Reduce `maxTokens` and `contextLines`
3. Use Ollama for free local inference
4. Monitor with `Show Token Usage Statistics`

---

## Advanced Usage

### Custom Prompts

Craft specific prompts in chat for better results:

```
"Refactor @selection to use the repository pattern, with dependency injection and proper error handling"

"Generate comprehensive integration tests for @selection including happy path, error cases, and edge cases"

"Analyze @workspace and suggest a better folder structure following clean architecture principles"
```

### Workflow Integration

**Pre-Commit Review:**
```
1. Stage your changes: git add .
2. Use: Review @git
3. Fix issues
4. Run: Security Scan on changed files
5. Commit with confidence
```

**Code Review Process:**
```
1. Select PR code
2. Run: Review Code
3. Run: Security Scan
4. Run: Performance Optimization
5. Compile feedback
```

**Test-Driven Development:**
```
1. Write function signature
2. Generate Unit Tests
3. Run tests (they fail)
4. Implement function
5. Tests pass! ✅
```

---

## Getting Help

- **Documentation:** README.md in extension folder
- **Issues:** Report bugs on GitHub
- **Discussions:** Ask questions on GitHub Discussions
- **Output Panel:** View → Output → UniCopilot for logs

---

**Happy Coding with UniCopilot! 🚀**
