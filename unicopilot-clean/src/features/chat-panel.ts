/**
 * src/features/chat-panel.ts
 * Sidebar chat webview — full streaming chat with history.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getActiveProvider } from '../providers/registry';
import { ChatMessage } from '../providers/base';

const SYSTEM_PROMPT = `You are UniCopilot, an expert AI coding assistant embedded in VS Code.
You help developers write, understand, debug, and improve code.
Be concise and practical. Use markdown with proper code fencing.
When providing code examples, always specify the language in the code fence.`;

export class ChatPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'unicopilot.chatView';
  private _view?: vscode.WebviewView;
  private _history: ChatMessage[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _secrets: vscode.SecretStorage
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this._getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(msg => this._handleMessage(msg));
  }

  /** Called externally (e.g. from commands.ts) to inject a message */
  postMessage(msg: unknown) {
    this._view?.webview.postMessage(msg);
  }

  // ── message handler ───────────────────────────────────────────────────────

  private async _handleMessage(msg: { type: string; text?: string }) {
    switch (msg.type) {
      case 'chat': await this._handleChat(msg.text ?? ''); break;
      case 'clearHistory': this._history = []; break;
      case 'insertCode': await this._insertCodeToEditor(msg.text ?? ''); break;
      case 'getContext': await this._sendEditorContext(); break;
    }
  }

  private async _handleChat(userText: string) {
    if (!userText.trim()) { return; }

    // Append editor context if user used @file or @selection
    const enriched = await this._enrichWithContext(userText);

    this._history.push({ role: 'user', content: enriched });

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this._history,
    ];

    this._view?.webview.postMessage({ type: 'startAssistantMessage' });

    try {
      const cfg = vscode.workspace.getConfiguration('unicopilot');
      const { provider, config } = await getActiveProvider(this._secrets);

      let fullResponse = '';
      await provider.chatStream(
        {
          messages,
          maxTokens: cfg.get<number>('chatMaxTokens', 4096),
          temperature: cfg.get<number>('temperature', 0.2),
          stream: true,
        },
        config,
        (chunk) => {
          fullResponse += chunk;
          this._view?.webview.postMessage({ type: 'chunk', text: chunk });
        }
      );

      this._history.push({ role: 'assistant', content: fullResponse });
      this._view?.webview.postMessage({ type: 'endAssistantMessage' });

      // Keep history bounded
      if (this._history.length > 40) {
        this._history = this._history.slice(-40);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`UniCopilot: ${err.message}`);
      this._view?.webview.postMessage({ type: 'error', text: err.message });
    }
  }

  private async _enrichWithContext(text: string): Promise<string> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return text; }

    let enriched = text;

    if (text.includes('@selection') && !editor.selection.isEmpty) {
      const sel = editor.document.getText(editor.selection);
      const lang = editor.document.languageId;
      enriched = enriched.replace('@selection', `\n\`\`\`${lang}\n${sel}\n\`\`\``);
    }

    if (text.includes('@file')) {
      const content = editor.document.getText();
      const lang = editor.document.languageId;
      const name = path.basename(editor.document.fileName);
      enriched = enriched.replace('@file', `\n**File: ${name}**\n\`\`\`${lang}\n${content}\n\`\`\``);
    }

    return enriched;
  }

  private async _insertCodeToEditor(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('UniCopilot: No active editor to insert code into.');
      return;
    }
    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, code);
    });
  }

  private async _sendEditorContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }
    const fileName = path.basename(editor.document.fileName);
    const language = editor.document.languageId;
    const hasSelection = !editor.selection.isEmpty;
    this._view?.webview.postMessage({ type: 'editorContext', fileName, language, hasSelection });
  }

  // ── HTML ──────────────────────────────────────────────────────────────────

  private _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const cfg = vscode.workspace.getConfiguration('unicopilot');
    const providerName = cfg.get<string>('activeProvider', 'ollama');
    const modelName = cfg.get<string>('activeModel', '');

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UniCopilot</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: var(--vscode-sideBar-background, #1e1e1e);
    --fg: var(--vscode-sideBar-foreground, #cccccc);
    --input-bg: var(--vscode-input-background, #2d2d2d);
    --input-fg: var(--vscode-input-foreground, #cccccc);
    --input-border: var(--vscode-input-border, #3d3d3d);
    --btn-bg: var(--vscode-button-background, #0e639c);
    --btn-fg: var(--vscode-button-foreground, #ffffff);
    --btn-hover: var(--vscode-button-hoverBackground, #1177bb);
    --user-bg: var(--vscode-inputOption-activeBackground, #264f78);
    --assistant-bg: var(--vscode-editor-background, #252526);
    --border: var(--vscode-panel-border, #3d3d3d);
    --accent: var(--vscode-focusBorder, #007fd4);
    --error: var(--vscode-errorForeground, #f48771);
    --code-bg: var(--vscode-textCodeBlock-background, #1a1a1a);
    --font: var(--vscode-font-family, 'Segoe UI', sans-serif);
    --font-mono: var(--vscode-editor-font-family, 'Cascadia Code', monospace);
    --radius: 6px;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--fg);
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-size: 13px;
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    gap: 8px;
  }
  .header-left { display: flex; align-items: center; gap: 6px; }
  .logo { font-size: 14px; font-weight: 700; color: var(--accent); letter-spacing: -0.3px; }
  .model-badge {
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 11px;
    color: var(--fg);
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
  .icon-btn {
    background: none;
    border: none;
    color: var(--fg);
    cursor: pointer;
    opacity: 0.6;
    padding: 3px;
    border-radius: 3px;
    font-size: 14px;
    display: flex;
    align-items: center;
    transition: opacity 0.15s;
  }
  .icon-btn:hover { opacity: 1; background: var(--input-bg); }

  /* ── Messages ── */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .message { display: flex; flex-direction: column; gap: 4px; animation: fadeIn 0.15s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

  .message-role {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.5;
  }
  .message.user .message-role { color: var(--accent); }
  .message.assistant .message-role { color: var(--fg); }

  .message-content {
    padding: 8px 10px;
    border-radius: var(--radius);
    line-height: 1.55;
    word-break: break-word;
  }
  .message.user .message-content {
    background: var(--user-bg);
    border: 1px solid rgba(255,255,255,0.05);
  }
  .message.assistant .message-content {
    background: var(--assistant-bg);
    border: 1px solid var(--border);
  }

  /* Markdown-ish code blocks */
  .message-content pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px 12px;
    overflow-x: auto;
    margin: 6px 0;
    font-size: 12px;
    position: relative;
  }
  .message-content code {
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .message-content p code {
    background: var(--code-bg);
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid var(--border);
  }

  .copy-btn {
    position: absolute;
    top: 4px;
    right: 6px;
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--fg);
    cursor: pointer;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  pre:hover .copy-btn { opacity: 1; }

  .insert-btn {
    position: absolute;
    top: 4px;
    right: 52px;
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--accent);
    cursor: pointer;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  pre:hover .insert-btn { opacity: 1; }

  /* streaming cursor */
  .streaming-cursor::after {
    content: '▋';
    animation: blink 0.7s step-end infinite;
    color: var(--accent);
  }
  @keyframes blink { 50% { opacity: 0; } }

  /* ── Context hints ── */
  .context-bar {
    padding: 4px 12px;
    font-size: 11px;
    opacity: 0.6;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .ctx-tag {
    background: var(--input-bg);
    border: 1px solid var(--border);
    padding: 1px 6px;
    border-radius: 3px;
    cursor: pointer;
  }
  .ctx-tag:hover { border-color: var(--accent); color: var(--accent); }

  /* ── Input ── */
  .input-area {
    padding: 8px 12px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .textarea-wrap { position: relative; }
  textarea {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: var(--radius);
    color: var(--input-fg);
    font-family: var(--font);
    font-size: 13px;
    padding: 8px 36px 8px 10px;
    resize: none;
    outline: none;
    line-height: 1.5;
    min-height: 60px;
    max-height: 160px;
    overflow-y: auto;
    transition: border-color 0.15s;
  }
  textarea:focus { border-color: var(--accent); }
  textarea::placeholder { opacity: 0.4; }

  .send-btn {
    position: absolute;
    right: 6px;
    bottom: 6px;
    background: var(--btn-bg);
    color: var(--btn-fg);
    border: none;
    border-radius: 4px;
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: background 0.15s;
  }
  .send-btn:hover:not(:disabled) { background: var(--btn-hover); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .error-msg {
    color: var(--error);
    font-size: 12px;
    padding: 4px 0;
  }

  /* ── Empty state ── */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0.5;
    padding: 24px;
    text-align: center;
  }
  .empty-icon { font-size: 32px; }
  .empty-title { font-size: 14px; font-weight: 600; }
  .empty-desc { font-size: 12px; line-height: 1.5; }
  .suggestion-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
  .chip {
    background: var(--input-bg);
    border: 1px solid var(--border);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    cursor: pointer;
    opacity: 1;
    transition: border-color 0.15s;
  }
  .chip:hover { border-color: var(--accent); }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <span class="logo">⬡ UniCopilot</span>
    <span class="model-badge" id="modelBadge">${modelName || providerName}</span>
  </div>
  <div style="display:flex;gap:4px">
    <button class="icon-btn" id="clearBtn" title="Clear chat">🗑</button>
  </div>
</div>

<div class="messages" id="messages">
  <div class="empty-state" id="emptyState">
    <div class="empty-icon">⬡</div>
    <div class="empty-title">UniCopilot</div>
    <div class="empty-desc">Ask anything about your code.<br>Use <strong>@selection</strong> or <strong>@file</strong> to include context.</div>
    <div class="suggestion-chips">
      <span class="chip" data-prompt="Explain @selection">Explain selection</span>
      <span class="chip" data-prompt="Fix bugs in @selection">Fix bugs</span>
      <span class="chip" data-prompt="Write unit tests for @selection">Write tests</span>
      <span class="chip" data-prompt="Refactor @selection for readability">Refactor</span>
    </div>
  </div>
</div>

<div class="context-bar" id="contextBar" style="display:none">
  <span style="opacity:0.5">Insert:</span>
  <span class="ctx-tag" data-insert="@selection">@selection</span>
  <span class="ctx-tag" data-insert="@file">@file</span>
</div>

<div class="input-area">
  <div class="textarea-wrap">
    <textarea id="input" placeholder="Ask about your code… (Enter to send, Shift+Enter for newline)" rows="2"></textarea>
    <button class="send-btn" id="sendBtn" title="Send (Enter)">↑</button>
  </div>
</div>

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const emptyState = document.getElementById('emptyState');
  const modelBadge = document.getElementById('modelBadge');
  const contextBar = document.getElementById('contextBar');

  let streaming = false;
  let currentAssistantEl = null;
  let currentContentEl = null;
  let streamBuffer = '';

  // ── Send ──────────────────────────────────────────────────────────────────
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || streaming) { return; }
    appendUserMessage(text);
    inputEl.value = '';
    autoResize();
    sendBtn.disabled = true;
    streaming = true;
    vscode.postMessage({ type: 'chat', text });
  }

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('input', autoResize);

  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  function appendUserMessage(text) {
    hideEmpty();
    const el = createMessageEl('user', escapeHtml(text).replace(/\n/g, '<br>'));
    messagesEl.appendChild(el);
    scrollBottom();
  }

  function createMessageEl(role, contentHtml) {
    const wrap = document.createElement('div');
    wrap.className = \`message \${role}\`;
    wrap.innerHTML = \`<div class="message-role">\${role === 'user' ? 'You' : 'UniCopilot'}</div>
      <div class="message-content">\${contentHtml}</div>\`;
    return wrap;
  }

  // ── Streaming ─────────────────────────────────────────────────────────────
  window.addEventListener('message', ({ data }) => {
    switch (data.type) {
      case 'startAssistantMessage': startStream(); break;
      case 'chunk': appendChunk(data.text); break;
      case 'endAssistantMessage': endStream(); break;
      case 'userMessage': appendUserMessage(data.text); break;
      case 'error': showError(data.text); endStream(); break;
      case 'editorContext':
        if (data.fileName) {
          contextBar.style.display = 'flex';
        }
        break;
    }
  });

  function startStream() {
    hideEmpty();
    streamBuffer = '';
    const wrap = document.createElement('div');
    wrap.className = 'message assistant';
    currentAssistantEl = wrap;
    const role = document.createElement('div');
    role.className = 'message-role';
    role.textContent = 'UniCopilot';
    const content = document.createElement('div');
    content.className = 'message-content streaming-cursor';
    currentContentEl = content;
    wrap.appendChild(role);
    wrap.appendChild(content);
    messagesEl.appendChild(wrap);
    scrollBottom();
  }

  function appendChunk(text) {
    if (!currentContentEl) { return; }
    streamBuffer += text;
    currentContentEl.innerHTML = renderMarkdown(streamBuffer);
    scrollBottom();
  }

  function endStream() {
    streaming = false;
    sendBtn.disabled = false;
    if (currentContentEl) {
      currentContentEl.classList.remove('streaming-cursor');
      currentContentEl.innerHTML = renderMarkdown(streamBuffer);
      addCodeButtons(currentContentEl);
    }
    currentAssistantEl = null;
    currentContentEl = null;
    streamBuffer = '';
  }

  function showError(msg) {
    if (currentContentEl) {
      currentContentEl.innerHTML = \`<span class="error-msg">❌ \${escapeHtml(msg)}</span>\`;
      currentContentEl.classList.remove('streaming-cursor');
    }
  }

  // ── Simple markdown renderer ──────────────────────────────────────────────
  function renderMarkdown(text) {
    return text
      // code blocks
      .replace(/\`\`\`(\\w+)?\\n?([\\s\\S]*?)\`\`\`/g, (_, lang, code) =>
        \`<pre data-code="\${escapeAttr(code.trim())}"><button class="copy-btn" onclick="copyCode(this)">Copy</button><button class="insert-btn" onclick="insertCode(this)">Insert</button><code>\${escapeHtml(code.trim())}</code></pre>\`)
      // inline code
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // headers
      .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:13px">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;font-size:14px">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="margin:10px 0 4px;font-size:15px">$1</h2>')
      // bullets
      .replace(/^[-*] (.+)$/gm, '<li style="margin:2px 0;padding-left:4px">$1</li>')
      // paragraphs
      .replace(/\\n\\n+/g, '</p><p style="margin:6px 0">')
      .replace(/\\n/g, '<br>');
  }

  function addCodeButtons(el) {
    el.querySelectorAll('pre').forEach(pre => {
      if (!pre.querySelector('.copy-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => copyCode(copyBtn);
        pre.appendChild(copyBtn);
      }
    });
  }

  function copyCode(btn) {
    const code = btn.closest('pre').dataset.code || btn.closest('pre').querySelector('code')?.textContent || '';
    navigator.clipboard?.writeText(code);
    btn.textContent = '✓';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  }

  function insertCode(btn) {
    const code = btn.closest('pre').dataset.code || btn.closest('pre').querySelector('code')?.textContent || '';
    vscode.postMessage({ type: 'insertCode', text: code });
  }

  // ── Context tags ──────────────────────────────────────────────────────────
  document.querySelectorAll('.ctx-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const insert = tag.dataset.insert;
      const pos = inputEl.selectionStart;
      inputEl.value = inputEl.value.slice(0, pos) + insert + inputEl.value.slice(pos);
      inputEl.focus();
    });
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputEl.value = chip.dataset.prompt;
      autoResize();
      inputEl.focus();
    });
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    messagesEl.innerHTML = '';
    messagesEl.appendChild(emptyState);
    emptyState.style.display = 'flex';
    vscode.postMessage({ type: 'clearHistory' });
  });

  // ── utils ─────────────────────────────────────────────────────────────────
  function hideEmpty() { emptyState.style.display = 'none'; }
  function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }
  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }

  // Request editor context on load
  vscode.postMessage({ type: 'getContext' });
</script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) { text += chars.charAt(Math.floor(Math.random() * chars.length)); }
  return text;
}
