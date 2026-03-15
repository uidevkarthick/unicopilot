/**
 * src/features/code-intelligence.ts
 * Advanced code intelligence features: unit tests, docs, security, performance, review.
 */

import * as vscode from 'vscode';
import { getActiveProvider } from '../providers/registry';
import { ChatMessage } from '../providers/base';

const SYSTEM_PROMPT = `You are UniCopilot, an expert software engineer with deep knowledge in:
- Software architecture and design patterns
- Security best practices
- Performance optimization
- Code quality and maintainability
- Testing strategies
- Documentation standards

Be precise, actionable, and provide code examples when relevant.`;

/**
 * Generate unit tests for selected code
 */
export async function generateTests(
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('UniCopilot: No active editor.');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(
    selection.isEmpty
      ? new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end)
      : selection
  );

  if (!code.trim()) {
    vscode.window.showWarningMessage('UniCopilot: No code to generate tests for.');
    return;
  }

  const language = editor.document.languageId;
  const filename = editor.document.fileName;

  const userPrompt = `Generate comprehensive unit tests for the following ${language} code.

**Requirements:**
- Use appropriate testing framework (Jest for JS/TS, pytest for Python, etc.)
- Include edge cases and error scenarios
- Add clear test descriptions
- Follow best practices for the language
- Make tests maintainable and readable

**Code:**
\`\`\`${language}
${code}
\`\`\`

**File:** ${filename}

Provide the complete test code with imports and setup.`;

  await executeIntelligenceCommand('Generate Unit Tests', userPrompt, secrets, chatPanel);
}

/**
 * Generate documentation for selected code
 */
export async function generateDocs(
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('UniCopilot: No active editor.');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(
    selection.isEmpty
      ? new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end)
      : selection
  );

  if (!code.trim()) {
    vscode.window.showWarningMessage('UniCopilot: No code to document.');
    return;
  }

  const language = editor.document.languageId;

  const userPrompt = `Generate comprehensive documentation for the following ${language} code.

**Include:**
- Function/class/module descriptions
- Parameter descriptions with types
- Return value descriptions
- Usage examples
- Edge cases and important notes
- Use appropriate doc format (JSDoc for JS/TS, docstrings for Python, etc.)

**Code:**
\`\`\`${language}
${code}
\`\`\`

Provide the documented version of the code.`;

  await executeIntelligenceCommand('Generate Documentation', userPrompt, secrets, chatPanel);
}

/**
 * Perform security scan on selected code
 */
export async function securityScan(
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('UniCopilot: No active editor.');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(
    selection.isEmpty
      ? new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end)
      : selection
  );

  if (!code.trim()) {
    vscode.window.showWarningMessage('UniCopilot: No code to scan.');
    return;
  }

  const language = editor.document.languageId;

  const userPrompt = `Perform a comprehensive security analysis of the following ${language} code.

**Check for:**
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Authentication/authorization issues
- Insecure data storage
- Hardcoded secrets or credentials
- Insecure cryptographic practices
- Input validation issues
- CSRF vulnerabilities
- Dependency vulnerabilities
- Information disclosure

**Code:**
\`\`\`${language}
${code}
\`\`\`

For each issue found:
1. **Severity:** Critical/High/Medium/Low
2. **Issue:** Clear description
3. **Location:** Line/function where it occurs
4. **Fix:** Specific code fix with explanation

If no issues found, confirm the code is secure.`;

  await executeIntelligenceCommand('Security Scan', userPrompt, secrets, chatPanel);
}

/**
 * Optimize code performance
 */
export async function optimizePerformance(
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('UniCopilot: No active editor.');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(
    selection.isEmpty
      ? new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end)
      : selection
  );

  if (!code.trim()) {
    vscode.window.showWarningMessage('UniCopilot: No code to optimize.');
    return;
  }

  const language = editor.document.languageId;

  const userPrompt = `Analyze and optimize the performance of the following ${language} code.

**Analyze:**
- Time complexity (Big O notation)
- Space complexity
- Potential bottlenecks
- Inefficient algorithms or data structures
- Unnecessary computations
- Memory leaks (if applicable)
- Database query optimization (if applicable)

**Code:**
\`\`\`${language}
${code}
\`\`\`

For each optimization:
1. **Issue:** What's inefficient
2. **Impact:** Performance impact (High/Medium/Low)
3. **Solution:** Optimized code with explanation
4. **Complexity:** Before → After complexity

Provide the optimized version of the code.`;

  await executeIntelligenceCommand('Performance Optimization', userPrompt, secrets, chatPanel);
}

/**
 * Perform comprehensive code review
 */
export async function reviewCode(
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('UniCopilot: No active editor.');
    return;
  }

  const selection = editor.selection;
  const code = editor.document.getText(
    selection.isEmpty
      ? new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end)
      : selection
  );

  if (!code.trim()) {
    vscode.window.showWarningMessage('UniCopilot: No code to review.');
    return;
  }

  const language = editor.document.languageId;

  const userPrompt = `Perform a comprehensive code review of the following ${language} code.

**Review for:**
1. **Code Quality:**
   - Readability and maintainability
   - Naming conventions
   - Code organization
   - Comments and documentation

2. **Best Practices:**
   - Design patterns
   - DRY (Don't Repeat Yourself)
   - SOLID principles
   - Language-specific idioms

3. **Potential Issues:**
   - Logic errors
   - Edge cases not handled
   - Error handling
   - Type safety

4. **Performance:**
   - Obvious inefficiencies
   - Scalability concerns

5. **Testing:**
   - Testability
   - Missing test cases

**Code:**
\`\`\`${language}
${code}
\`\`\`

Provide:
- ✅ **Strengths:** What's done well
- ⚠️ **Issues:** Problems found (with severity)
- 💡 **Suggestions:** Specific improvements with code examples
- ⭐ **Overall Score:** 1-10 with justification`;

  await executeIntelligenceCommand('Code Review', userPrompt, secrets, chatPanel);
}

/**
 * Execute an intelligence command (shared logic)
 */
async function executeIntelligenceCommand(
  label: string,
  userPrompt: string,
  secrets: vscode.SecretStorage,
  chatPanel?: { postMessage: (msg: unknown) => void }
): Promise<void> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  // If chat panel is open, stream there
  if (chatPanel) {
    chatPanel.postMessage({ type: 'userMessage', text: `**${label}**` });
    chatPanel.postMessage({ type: 'startAssistantMessage' });

    try {
      const cfg = vscode.workspace.getConfiguration('unicopilot');
      const { provider, config } = await getActiveProvider(secrets);
      await provider.chatStream(
        { messages, maxTokens: cfg.get<number>('chatMaxTokens', 4096), temperature: 0.3 },
        config,
        (chunk) => chatPanel.postMessage({ type: 'chunk', text: chunk })
      );
      chatPanel.postMessage({ type: 'endAssistantMessage' });
    } catch (err: any) {
      chatPanel.postMessage({ type: 'error', text: err.message });
    }
    return;
  }

  // Fallback: output channel
  const channel = vscode.window.createOutputChannel('UniCopilot');
  channel.show(true);
  channel.appendLine(`\n── UniCopilot: ${label} ──────────────────────\n`);

  try {
    const cfg = vscode.workspace.getConfiguration('unicopilot');
    const { provider, config } = await getActiveProvider(secrets);
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `UniCopilot: ${label}...`, cancellable: false },
      async () => {
        await provider.chatStream(
          { messages, maxTokens: cfg.get<number>('chatMaxTokens', 4096), temperature: 0.3 },
          config,
          (chunk) => channel.append(chunk)
        );
      }
    );
    channel.appendLine('\n\n── Done ───────────────────────────────────\n');
  } catch (err: any) {
    channel.appendLine(`\n❌ Error: ${err.message}`);
    vscode.window.showErrorMessage(`UniCopilot: ${err.message}`);
  }
}
