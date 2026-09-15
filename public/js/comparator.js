/**
 * LexiClarity - Side-by-Side Redline & Contract Comparator UI
 * Dual-pane visual diff, risk delta calculation, and clause shift analysis.
 */

class ContractComparatorUI {
  static currentComparison = null;

  static init() {
    const compareBtn = document.getElementById('runCompareBtn');
    const loadNdaSampleBtn = document.getElementById('loadNdaCompareSampleBtn');

    if (compareBtn) {
      compareBtn.addEventListener('click', () => this.runComparison());
    }

    if (loadNdaSampleBtn) {
      loadNdaSampleBtn.addEventListener('click', () => this.loadNdaSample());
    }
  }

  static loadNdaSample() {
    const docA = document.getElementById('compareDocA');
    const docB = document.getElementById('compareDocB');
    if (docA && docB && window.SAMPLE_DOCUMENTS) {
      docA.value = window.SAMPLE_DOCUMENTS.ndaStandard.text;
      docB.value = window.SAMPLE_DOCUMENTS.ndaVendor.text;
      window.app.showToast('Loaded Standard NDA vs Aggressive Vendor NDA!');
    }
  }

  static async runComparison() {
    const docAText = document.getElementById('compareDocA').value.trim();
    const docBText = document.getElementById('compareDocB').value.trim();

    if (!docAText || !docBText) {
      alert('Please provide text for both Document A (Baseline) and Document B (Comparison Version).');
      return;
    }

    const resultsArea = document.getElementById('compareResults');
    resultsArea.innerHTML = `<div class="loading-spinner">Performing semantic redline comparison...</div>`;
    resultsArea.classList.remove('hidden');

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docA: docAText, docB: docBText })
      });
      const json = await res.json();
      if (json.success) {
        this.currentComparison = json.data;
        this.renderResults(json.data);
      } else {
        resultsArea.innerHTML = `<p class="error-msg">Comparison error: ${json.error}</p>`;
      }
    } catch (e) {
      resultsArea.innerHTML = `<p class="error-msg">Network error: ${e.message}</p>`;
    }
  }

  static renderResults(data) {
    const resultsArea = document.getElementById('compareResults');
    if (!resultsArea) return;

    const deltaClass = data.scoreDelta > 0 ? 'favorable' : (data.scoreDelta < 0 ? 'hazardous' : 'neutral');
    const deltaSign = data.scoreDelta > 0 ? `+${data.scoreDelta}` : `${data.scoreDelta}`;

    resultsArea.innerHTML = `
      <div class="compare-header-card">
        <div class="compare-verdict-section">
          <h3>Comparison Summary & Risk Delta</h3>
          <p class="verdict-statement ${deltaClass}"><strong>${data.verdict}</strong></p>
        </div>

        <div class="compare-stats-grid">
          <div class="stat-card">
            <span class="stat-label">Doc A Safety</span>
            <span class="stat-val">${data.docASummary.score}/100</span>
            <span class="stat-sub">Traps: ${data.docASummary.trapsCount}</span>
          </div>
          <div class="stat-card delta ${deltaClass}">
            <span class="stat-label">Risk Shift</span>
            <span class="stat-val">${deltaSign} pts</span>
            <span class="stat-sub">${data.scoreDelta < 0 ? 'Increased Exposure' : 'Safer Terms'}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Doc B Safety</span>
            <span class="stat-val">${data.docBSummary.score}/100</span>
            <span class="stat-sub">Traps: ${data.docBSummary.trapsCount}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Clauses Modified</span>
            <span class="stat-val">${data.changesCount.modified}</span>
            <span class="stat-sub">Added: ${data.changesCount.added}, Removed: ${data.changesCount.removed}</span>
          </div>
        </div>
      </div>

      <div class="compare-changes-list">
        <h3>Clause-by-Clause Redline Breakdown</h3>
        ${data.changes.map((change, idx) => `
          <div class="compare-change-card type-${change.type.toLowerCase()}">
            <div class="change-header">
              <span class="change-type-pill ${change.type.toLowerCase()}">${change.type}</span>
              <span class="change-risk-shift ${change.riskShift.toLowerCase().replace(/\s+/g, '-')}">
                Risk Shift: ${change.riskShift}
              </span>
              <span class="change-title">${change.title}</span>
            </div>
            
            <p class="change-explanation"><strong>Analysis:</strong> ${change.explanation}</p>

            <div class="dual-diff-grid">
              <div class="diff-column doc-a">
                <div class="diff-col-title">Document A (Original)</div>
                <div class="diff-text-box">${change.clauseA ? change.clauseA : '<em>[Clause not present in Doc A]</em>'}</div>
              </div>
              <div class="diff-column doc-b">
                <div class="diff-col-title">Document B (Counter-Offer)</div>
                <div class="diff-text-box">${change.clauseB ? change.clauseB : '<em>[Clause deleted in Doc B]</em>'}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.ContractComparatorUI = ContractComparatorUI;
