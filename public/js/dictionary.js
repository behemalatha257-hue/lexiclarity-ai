/**
 * LexiClarity - Legal Dictionary & Plain-English Glossary UI
 * Instant search, category filters, and practical negotiation tips.
 */

class LegalDictionaryUI {
  static allTerms = [];

  static async init() {
    const searchInput = document.getElementById('dictSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterTerms(e.target.value));
    }

    await this.fetchTerms();
  }

  static async fetchTerms() {
    const container = document.getElementById('dictionaryTermsList');
    if (!container) return;

    try {
      const res = await fetch('/api/dictionary');
      const json = await res.json();
      if (json.success) {
        this.allTerms = json.data;
        this.renderTerms(this.allTerms);
      }
    } catch (e) {
      container.innerHTML = `<p class="error-msg">Failed to load dictionary: ${e.message}</p>`;
    }
  }

  static filterTerms(query) {
    if (!query) {
      this.renderTerms(this.allTerms);
      return;
    }
    const q = query.toLowerCase().trim();
    const filtered = this.allTerms.filter(item => 
      item.term.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.plainMeaning.toLowerCase().includes(q) ||
      (item.latin && item.latin.toLowerCase().includes(q))
    );
    this.renderTerms(filtered);
  }

  static filterByCategory(cat) {
    if (cat === 'all') {
      this.renderTerms(this.allTerms);
      return;
    }
    const filtered = this.allTerms.filter(item => item.category.toLowerCase().includes(cat.toLowerCase()));
    this.renderTerms(filtered);
  }

  static renderTerms(terms) {
    const container = document.getElementById('dictionaryTermsList');
    if (!container) return;

    if (terms.length === 0) {
      container.innerHTML = `<p class="empty-text">No matching legal terms found. Try searching for "indemnification", "arbitration", or "damages".</p>`;
      return;
    }

    container.innerHTML = terms.map(item => `
      <div class="dict-term-card">
        <div class="term-card-header">
          <div class="term-title-block">
            <h4 class="term-name">${item.term}</h4>
            ${item.latin ? `<span class="latin-tag">Latin: <em>${item.latin}</em></span>` : ''}
          </div>
          <div class="term-badges">
            <span class="dict-cat-pill">${item.category}</span>
            <span class="dict-risk-pill risk-${item.riskLevel.toLowerCase()}">${item.riskLevel} Risk</span>
          </div>
        </div>

        <div class="term-meaning">
          <strong>💡 Plain-English Meaning:</strong>
          <p>${item.plainMeaning}</p>
        </div>

        <div class="term-example">
          <span class="example-label">Contract Example:</span>
          <blockquote>"${item.example}"</blockquote>
        </div>

        <div class="term-tip">
          <strong>🛡️ Practical Tip:</strong>
          <span>${item.tip}</span>
        </div>

        <div class="term-footer">
          <button type="button" class="btn-sm btn-subtle" onclick="window.accessibility.speakText('${escape(item.term + '. ' + item.plainMeaning)}')">
            🔊 Listen
          </button>
        </div>
      </div>
    `).join('');
  }
}

window.LegalDictionaryUI = LegalDictionaryUI;
