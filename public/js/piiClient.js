/**
 * LexiGuard - Client-Side PII Redaction & Privacy Engine
 * Analyzes and masks personal data locally in the browser before AI transmission.
 */

class PiiClient {
  static currentPii = null;

  static PATTERNS = {
    ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
    phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    usAddress: /\b\d+\s+[A-Za-z0-9\s,.'-]{4,40}\s+(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Highway|Hwy|Suite|Ste|Apt|Unit)\b/gi
  };

  /**
   * Scans text locally and returns masked text + entity details
   */
  static sanitizeLocal(rawText) {
    if (!rawText) return { sanitizedText: '', detectedCount: 0, items: [], isClean: true };

    let masked = rawText;
    const items = [];
    let count = 1;

    for (const [type, regex] of Object.entries(this.PATTERNS)) {
      masked = masked.replace(regex, (match) => {
        const token = `[REDACTED_${type.toUpperCase()}_${count++}]`;
        items.push({
          type,
          token,
          preview: match.length > 5 ? `${match.slice(0, 2)}***${match.slice(-2)}` : '***',
          original: match
        });
        return token;
      });
    }

    this.currentPii = {
      sanitizedText: masked,
      detectedCount: items.length,
      items,
      isClean: items.length === 0
    };

    return this.currentPii;
  }

  /**
   * Renders the interactive PII Shield badge and preview panel
   */
  static renderShieldBadge(containerId, piiResult) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (piiResult.detectedCount === 0) {
      container.innerHTML = `
        <div class="pii-badge clean">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span><strong>Privacy Shield Clean:</strong> Zero Direct PII Detected (100% Privacy Score)</span>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="pii-badge redacted">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/></svg>
            <span><strong>LexiGuard Active:</strong> ${piiResult.detectedCount} sensitive PII item(s) redacted locally</span>
          </div>
          <button type="button" class="btn-subtle btn-sm" onclick="PiiClient.showPiiModal()">View Redacted Items</button>
        </div>
      `;
    }
  }

  static showPiiModal() {
    const modal = document.getElementById('piiModal');
    const list = document.getElementById('piiModalItemsList');
    if (!modal) return;

    if (list && this.currentPii && this.currentPii.items.length > 0) {
      list.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto; margin-bottom:1rem;">
          ${this.currentPii.items.map((item, i) => `
            <div style="display:flex; justify-content:space-between; background:var(--bg-inset); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); font-size:0.85rem;">
              <span><strong>${item.type.toUpperCase()}:</strong> <code>${item.token}</code></span>
              <span style="color:var(--text-muted); font-family:var(--font-mono);">${item.preview}</span>
            </div>
          `).join('')}
        </div>
        <p style="font-size:0.8rem; color:var(--color-success); font-weight:600;">🔒 All items are masked client-side before any AI reasoning or cloud transmission.</p>
      `;
    }

    modal.classList.remove('hidden');
  }

  static closePiiModal() {
    const modal = document.getElementById('piiModal');
    if (modal) modal.classList.add('hidden');
  }
}

window.PiiClient = PiiClient;
