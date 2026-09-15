/**
 * LexiClarity - Grounded AI Legal Chat Assistant
 * Conversational interface with clause-grounded citations, popover snippets, and speech synthesis.
 */

class LegalChatUI {
  static messages = [];

  static init() {
    const sendBtn = document.getElementById('chatSendBtn');
    const input = document.getElementById('chatInput');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Quick prompt chip listener
    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (input) {
          input.value = chip.innerText.trim();
          this.sendMessage();
        }
      });
    });
  }

  static async sendMessage() {
    const input = document.getElementById('chatInput');
    const question = input ? input.value.trim() : '';
    if (!question) return;

    // Get active document text
    const activeDoc = window.app ? window.app.getActiveDocumentText() : '';
    if (!activeDoc) {
      alert('Please select or upload a document first.');
      return;
    }

    // Add user message to UI
    this.appendMessage('user', question);
    if (input) input.value = '';

    // Show loading assistant message
    const loadingId = this.appendLoading();

    try {
      const apiKey = localStorage.getItem('lexi_gemini_key') || null;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          documentText: activeDoc,
          apiKey
        })
      });

      const data = await res.json();
      this.removeLoading(loadingId);

      if (data.success) {
        this.appendMessage('assistant', data.data.answer, data.data.citations, data.data.provider);
      } else {
        this.appendMessage('assistant', `⚠️ Sorry, I encountered an issue: ${data.error}`);
      }
    } catch (e) {
      this.removeLoading(loadingId);
      this.appendMessage('assistant', `⚠️ Network connection error: ${e.message}`);
    }
  }

  static appendMessage(role, text, citations = [], provider = '') {
    const chatFeed = document.getElementById('chatMessagesFeed');
    if (!chatFeed) return;

    const msgId = `msg_${Date.now()}`;
    const formattedText = text
      .replace(/\n\n/g, '<br><br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)(?:<br>|$)/g, '<h4 style="margin:0.5rem 0; font-size:0.95rem; color:var(--text-primary);">$1</h4>');

    const msgEl = document.createElement('div');
    msgEl.className = `chat-bubble-row ${role}`;
    msgEl.id = msgId;

    let citationsHtml = '';
    if (citations && citations.length > 0) {
      citationsHtml = `
        <div class="chat-citations">
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Verified Grounded Citations:</span>
          <div class="citation-badges">
            ${citations.map(c => `
              <span class="citation-pill" title="${c.snippet}">
                📄 ${c.title}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    let audioBtnHtml = '';
    if (role === 'assistant') {
      audioBtnHtml = `
        <div class="chat-bubble-footer">
          <span class="provider-badge">${provider || 'LexiClarity Legal Engine'}</span>
          <button type="button" class="btn-bubble-tts" onclick="window.accessibility.speakText('${encodeURIComponent(text)}')">
            🔊 Read Aloud
          </button>
        </div>
      `;
    }

    msgEl.innerHTML = `
      <div class="chat-avatar" style="width:36px; height:36px; border-radius:50%; background:var(--bg-inset); display:flex; align-items:center; justify-content:center; font-size:1.1rem; box-shadow:var(--shadow-sm); border:1px solid var(--border-subtle);">${role === 'user' ? '👤' : '⚖️'}</div>
      <div class="chat-bubble ${role}">
        <div class="chat-text">${formattedText}</div>
        ${citationsHtml}
        ${audioBtnHtml}
      </div>
    `;

    chatFeed.appendChild(msgEl);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  static appendLoading() {
    const chatFeed = document.getElementById('chatMessagesFeed');
    if (!chatFeed) return null;

    const loadingId = `loading_${Date.now()}`;
    const el = document.createElement('div');
    el.className = 'chat-bubble-row assistant loading-bubble';
    el.id = loadingId;
    el.innerHTML = `
      <div class="chat-avatar" style="width:36px; height:36px; border-radius:50%; background:var(--bg-inset); display:flex; align-items:center; justify-content:center; font-size:1.1rem; box-shadow:var(--shadow-sm); border:1px solid var(--border-subtle);">⚖️</div>
      <div class="chat-bubble assistant" style="padding:0.75rem 1.25rem;">
        <span style="font-size:0.88rem; color:var(--text-muted); font-weight:600;">Analyzing clauses with Gemini...</span>
      </div>
    `;
    chatFeed.appendChild(el);
    chatFeed.scrollTop = chatFeed.scrollHeight;
    return loadingId;
  }

  static removeLoading(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

window.LegalChatUI = LegalChatUI;
