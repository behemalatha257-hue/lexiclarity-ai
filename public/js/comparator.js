/**
 * LexiClarity - Side-by-Side Redline & Contract Comparator UI
 * Word-level inline diff, animated risk delta arc, colour-coded change pills, copy/PDF export.
 */

class ContractComparatorUI {
  static currentComparison = null;

  static init() {
    const compareBtn = document.getElementById('runCompareBtn');
    const loadNdaSampleBtn = document.getElementById('loadNdaCompareSampleBtn');
    const clearCompareBtn = document.getElementById('clearCompareBtn');
    const copyRedlineBtn = document.getElementById('copyRedlineBtn');
    const printRedlineBtn = document.getElementById('printRedlineBtn');

    if (compareBtn) compareBtn.addEventListener('click', () => this.runComparison());
    if (loadNdaSampleBtn) loadNdaSampleBtn.addEventListener('click', () => this.loadNdaSample());
    if (clearCompareBtn) clearCompareBtn.addEventListener('click', () => this.clearAll());
    if (copyRedlineBtn) copyRedlineBtn.addEventListener('click', () => this.copyToClipboard());
    if (printRedlineBtn) printRedlineBtn.addEventListener('click', () => window.print());

    // Drag-drop on both textareas
    ['compareDocA', 'compareDocB'].forEach(id => {
      const ta = document.getElementById(id);
      if (!ta) return;
      ta.addEventListener('dragover', e => { e.preventDefault(); ta.classList.add('drag-active'); });
      ta.addEventListener('dragleave', () => ta.classList.remove('drag-active'));
      ta.addEventListener('drop', e => {
        e.preventDefault();
        ta.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file) this.readFileInto(file, ta);
      });
    });

    // Upload buttons
    const uploadBtnA = document.getElementById('uploadDocABtn');
    const uploadBtnB = document.getElementById('uploadDocBBtn');
    const fileA = document.getElementById('fileUploadA');
    const fileB = document.getElementById('fileUploadB');

    if (uploadBtnA && fileA) {
      uploadBtnA.addEventListener('click', () => fileA.click());
      fileA.addEventListener('change', () => {
        if (fileA.files[0]) this.readFileInto(fileA.files[0], document.getElementById('compareDocA'));
      });
    }
    if (uploadBtnB && fileB) {
      uploadBtnB.addEventListener('click', () => fileB.click());
      fileB.addEventListener('change', () => {
        if (fileB.files[0]) this.readFileInto(fileB.files[0], document.getElementById('compareDocB'));
      });
    }
  }

  static readFileInto(file, textarea) {
    const reader = new FileReader();
    reader.onload = e => {
      textarea.value = e.target.result;
      if (window.app) window.app.showToast(`📄 Loaded: ${file.name}`);
    };
    reader.readAsText(file);
  }

  static loadNdaSample() {
    const docA = document.getElementById('compareDocA');
    const docB = document.getElementById('compareDocB');
    if (docA && docB && window.SAMPLE_DOCUMENTS) {
      docA.value = window.SAMPLE_DOCUMENTS.ndaStandard.text;
      docB.value = window.SAMPLE_DOCUMENTS.ndaVendor.text;
      docA.style.height = 'auto'; docA.style.height = docA.scrollHeight + 'px';
      docB.style.height = 'auto'; docB.style.height = docB.scrollHeight + 'px';
      if (window.app) window.app.showToast('✅ Loaded Standard NDA vs Aggressive Vendor NDA!');
    }
  }

  static clearAll() {
    const docA = document.getElementById('compareDocA');
    const docB = document.getElementById('compareDocB');
    const results = document.getElementById('compareResults');
    if (docA) { docA.value = ''; docA.style.height = ''; }
    if (docB) { docB.value = ''; docB.style.height = ''; }
    if (results) { results.classList.add('hidden'); results.innerHTML = ''; }
    this.currentComparison = null;
  }

  static async runComparison() {
    const docAText = document.getElementById('compareDocA').value.trim();
    const docBText = document.getElementById('compareDocB').value.trim();

    if (!docAText || !docBText) {
      alert('Please provide text for both Document A (Baseline) and Document B (Counter-Offer).');
      return;
    }

    const resultsArea = document.getElementById('compareResults');
    resultsArea.innerHTML = `
      <div class="compare-loading-state">
        <div class="compare-loading-ring"></div>
        <div class="compare-loading-text">
          <strong>Performing semantic clause-level redline analysis…</strong>
          <span>Diffing paragraphs, scoring risk delta, and classifying change types</span>
        </div>
      </div>`;
    resultsArea.classList.remove('hidden');
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docA: docAText, docB: docBText })
      });
      const json = await res.json();
      if (json.success) {
        this.currentComparison = json.data;
        // Also enrich with client-side word diff
        this.enrichWithWordDiff(json.data, docAText, docBText);
        this.renderResults(json.data);
      } else {
        resultsArea.innerHTML = `<div class="compare-error-card">⚠️ Comparison error: ${json.error}</div>`;
      }
    } catch (e) {
      resultsArea.innerHTML = `<div class="compare-error-card">⚠️ Network error: ${e.message}</div>`;
    }
  }

  /* -------------------------------------------------------
   * WORD-LEVEL INLINE DIFF ENGINE
   * ------------------------------------------------------- */
  static wordDiff(textA, textB) {
    const wordsA = textA.split(/(\s+)/);
    const wordsB = textB.split(/(\s+)/);

    // Build LCS table
    const m = wordsA.length, n = wordsB.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = wordsA[i - 1] === wordsB[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    // Trace back
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
        ops.unshift({ type: 'eq', val: wordsA[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.unshift({ type: 'ins', val: wordsB[j - 1] });
        j--;
      } else {
        ops.unshift({ type: 'del', val: wordsA[i - 1] });
        i--;
      }
    }

    // Render for side A (deletions marked) and side B (insertions marked)
    const htmlA = ops.map(op => {
      if (op.type === 'eq') return this.escHtml(op.val);
      if (op.type === 'del') return `<mark class="diff-word-del">${this.escHtml(op.val)}</mark>`;
      return ''; // insertions hidden on side A
    }).join('');

    const htmlB = ops.map(op => {
      if (op.type === 'eq') return this.escHtml(op.val);
      if (op.type === 'ins') return `<mark class="diff-word-ins">${this.escHtml(op.val)}</mark>`;
      return ''; // deletions hidden on side B
    }).join('');

    return { htmlA, htmlB };
  }

  static escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  static enrichWithWordDiff(data, rawA, rawB) {
    // Paragraph-level split for full-doc diff
    const parasA = rawA.split(/\n{2,}/);
    const parasB = rawB.split(/\n{2,}/);
    data._paragraphDiffA = [];
    data._paragraphDiffB = [];

    const maxLen = Math.max(parasA.length, parasB.length);
    for (let i = 0; i < maxLen; i++) {
      const pA = parasA[i] || '';
      const pB = parasB[i] || '';
      if (pA === pB) {
        data._paragraphDiffA.push(`<p class="diff-para-eq">${this.escHtml(pA)}</p>`);
        data._paragraphDiffB.push(`<p class="diff-para-eq">${this.escHtml(pB)}</p>`);
      } else if (!pA) {
        data._paragraphDiffA.push(`<p class="diff-para-empty">[not in Doc A]</p>`);
        data._paragraphDiffB.push(`<p class="diff-para-ins">${this.escHtml(pB)}</p>`);
      } else if (!pB) {
        data._paragraphDiffA.push(`<p class="diff-para-del">${this.escHtml(pA)}</p>`);
        data._paragraphDiffB.push(`<p class="diff-para-empty">[removed in Doc B]</p>`);
      } else {
        const { htmlA, htmlB } = this.wordDiff(pA, pB);
        data._paragraphDiffA.push(`<p class="diff-para-mod">${htmlA}</p>`);
        data._paragraphDiffB.push(`<p class="diff-para-mod">${htmlB}</p>`);
      }
    }

    // Also enrich individual clause changes
    data.changes.forEach(change => {
      if (change.clauseA && change.clauseB) {
        const wd = this.wordDiff(change.clauseA, change.clauseB);
        change._diffA = wd.htmlA;
        change._diffB = wd.htmlB;
      } else {
        change._diffA = change.clauseA ? this.escHtml(change.clauseA) : '<em>[Not present in Doc A]</em>';
        change._diffB = change.clauseB ? this.escHtml(change.clauseB) : '<em>[Removed in Doc B]</em>';
      }
    });
  }

  /* -------------------------------------------------------
   * RENDER
   * ------------------------------------------------------- */
  static renderResults(data) {
    const resultsArea = document.getElementById('compareResults');
    if (!resultsArea) return;

    const deltaClass = data.scoreDelta < 0 ? 'hazardous' : (data.scoreDelta > 0 ? 'favorable' : 'neutral');
    const deltaSign = data.scoreDelta > 0 ? `+${data.scoreDelta}` : `${data.scoreDelta}`;
    const deltaLabel = data.scoreDelta < 0 ? 'Increased Risk Exposure' : (data.scoreDelta > 0 ? 'Safer Counter-Offer' : 'Neutral — Risk Unchanged');
    const deltaEmoji = data.scoreDelta < 0 ? '🔴' : (data.scoreDelta > 0 ? '🟢' : '⚪');

    // Arc arc progress (0-100 mapped to 0-251.2 stroke-dashoffset)
    const scoreA = data.docASummary.score;
    const scoreB = data.docBSummary.score;
    const arcA = 251.2 - (scoreA / 100) * 251.2;
    const arcB = 251.2 - (scoreB / 100) * 251.2;

    resultsArea.innerHTML = `
      <!-- SECTION 1: HEADER VERDICT CARD -->
      <div class="cmp-verdict-card">
        <div class="cmp-verdict-headline">
          ${deltaEmoji} <span class="cmp-verdict-text ${deltaClass}">${data.verdict}</span>
        </div>

        <!-- Risk Scorecards -->
        <div class="cmp-scorecard-row">
          <div class="cmp-score-block">
            <div class="cmp-arc-wrap">
              <svg viewBox="0 0 90 90" class="cmp-arc-svg">
                <circle cx="45" cy="45" r="40" class="cmp-arc-bg"/>
                <circle cx="45" cy="45" r="40" class="cmp-arc-fg doc-a-arc"
                  stroke-dasharray="251.2"
                  stroke-dashoffset="${arcA}"
                  transform="rotate(-90 45 45)"/>
              </svg>
              <div class="cmp-arc-label">${scoreA}<span>/100</span></div>
            </div>
            <div class="cmp-score-meta">
              <strong>Doc A – Baseline</strong>
              <span>${data.docASummary.trapsCount} trap${data.docASummary.trapsCount !== 1 ? 's' : ''} found</span>
            </div>
          </div>

          <div class="cmp-delta-block ${deltaClass}">
            <div class="cmp-delta-value">${deltaSign}</div>
            <div class="cmp-delta-label">Risk Shift</div>
            <div class="cmp-delta-sublabel">${deltaLabel}</div>
          </div>

          <div class="cmp-score-block">
            <div class="cmp-arc-wrap">
              <svg viewBox="0 0 90 90" class="cmp-arc-svg">
                <circle cx="45" cy="45" r="40" class="cmp-arc-bg"/>
                <circle cx="45" cy="45" r="40" class="cmp-arc-fg doc-b-arc"
                  stroke-dasharray="251.2"
                  stroke-dashoffset="${arcB}"
                  transform="rotate(-90 45 45)"/>
              </svg>
              <div class="cmp-arc-label">${scoreB}<span>/100</span></div>
            </div>
            <div class="cmp-score-meta">
              <strong>Doc B – Counter-Offer</strong>
              <span>${data.docBSummary.trapsCount} trap${data.docBSummary.trapsCount !== 1 ? 's' : ''} found</span>
            </div>
          </div>
        </div>

        <!-- Change Stats Bar -->
        <div class="cmp-stats-bar">
          <div class="cmp-stat-pill modified">
            <span class="cmp-stat-num">${data.changesCount.modified}</span>
            <span class="cmp-stat-lbl">Modified</span>
          </div>
          <div class="cmp-stat-pill added">
            <span class="cmp-stat-num">${data.changesCount.added}</span>
            <span class="cmp-stat-lbl">Added</span>
          </div>
          <div class="cmp-stat-pill removed">
            <span class="cmp-stat-num">${data.changesCount.removed}</span>
            <span class="cmp-stat-lbl">Removed</span>
          </div>
          <div class="cmp-stat-pill total">
            <span class="cmp-stat-num">${data.changes.length}</span>
            <span class="cmp-stat-lbl">Total Changes</span>
          </div>
          <div class="cmp-export-row">
            <button class="btn-subtle btn-sm" id="copyRedlineBtn" onclick="ContractComparatorUI.copyToClipboard()">📋 Copy Summary</button>
            <button class="btn-subtle btn-sm" onclick="window.print()">🖨 Print / PDF</button>
          </div>
        </div>
      </div>

      <!-- SECTION 2: FULL INLINE PARAGRAPH DIFF -->
      <div class="cmp-section-header">
        <h3>Full Document Inline Diff</h3>
        <p>Word-level changes highlighted: <mark class="diff-word-del" style="font-size:0.8rem;padding:0 4px;">deletions</mark> in Doc A · <mark class="diff-word-ins" style="font-size:0.8rem;padding:0 4px;">insertions</mark> in Doc B</p>
      </div>
      <div class="cmp-dual-panel">
        <div class="cmp-panel doc-a-panel">
          <div class="cmp-panel-header">
            <span class="cmp-panel-badge doc-a">A</span>
            <span>Baseline / Standard Terms</span>
          </div>
          <div class="cmp-panel-body">
            ${(data._paragraphDiffA || []).join('') || '<em style="color:var(--text-muted)">No content</em>'}
          </div>
        </div>
        <div class="cmp-panel doc-b-panel">
          <div class="cmp-panel-header">
            <span class="cmp-panel-badge doc-b">B</span>
            <span>Counter-Offer / Revised Version</span>
          </div>
          <div class="cmp-panel-body">
            ${(data._paragraphDiffB || []).join('') || '<em style="color:var(--text-muted)">No content</em>'}
          </div>
        </div>
      </div>

      <!-- SECTION 3: CLAUSE-BY-CLAUSE BREAKDOWN -->
      <div class="cmp-section-header" style="margin-top:2rem;">
        <h3>Clause-by-Clause Redline Breakdown</h3>
        <p>${data.changes.length} clause change${data.changes.length !== 1 ? 's' : ''} detected — each assessed for risk impact</p>
      </div>
      <div class="cmp-changes-list">
        ${data.changes.map((change, idx) => this.renderChangeCard(change, idx)).join('')}
      </div>
    `;

    // Animate arcs after render
    setTimeout(() => {
      document.querySelectorAll('.doc-a-arc').forEach(el => {
        el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)';
        el.setAttribute('stroke-dashoffset', arcA);
      });
      document.querySelectorAll('.doc-b-arc').forEach(el => {
        el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)';
        el.setAttribute('stroke-dashoffset', arcB);
      });
    }, 80);

    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  static renderChangeCard(change, idx) {
    const typeClass = change.type.toLowerCase().replace(/\s+/g, '-');
    const riskClass = (change.riskShift || '').toLowerCase().replace(/\s+/g, '-');
    const typeIcon = {
      'modified': '✏️',
      'added': '➕',
      'removed': '➖',
      'critical': '🚨'
    }[change.type.toLowerCase()] || '⚙️';

    return `
      <div class="cmp-change-card type-${typeClass}" id="change-${idx}">
        <div class="cmp-change-header">
          <div class="cmp-change-pills">
            <span class="cmp-type-pill type-${typeClass}">${typeIcon} ${change.type}</span>
            <span class="cmp-risk-pill risk-${riskClass}">${change.riskShift || 'Neutral'}</span>
          </div>
          <div class="cmp-change-title">${change.title || 'Unnamed Clause'}</div>
        </div>

        <div class="cmp-change-analysis">
          <strong>Analysis:</strong> ${change.explanation || 'Clause modified.'}
        </div>

        <div class="cmp-dual-diff">
          <div class="cmp-diff-col col-a">
            <div class="cmp-diff-col-label">
              <span class="cmp-panel-badge doc-a" style="font-size:0.7rem;padding:2px 8px;">A</span> Original
            </div>
            <div class="cmp-diff-text">${change._diffA || '<em class="text-muted">Not present</em>'}</div>
          </div>
          <div class="cmp-diff-col col-b">
            <div class="cmp-diff-col-label">
              <span class="cmp-panel-badge doc-b" style="font-size:0.7rem;padding:2px 8px;">B</span> Counter-Offer
            </div>
            <div class="cmp-diff-text">${change._diffB || '<em class="text-muted">Removed</em>'}</div>
          </div>
        </div>
      </div>
    `;
  }

  static copyToClipboard() {
    if (!this.currentComparison) return;
    const d = this.currentComparison;
    const text = [
      `LexiClarity AI — Contract Redline Report`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Verdict: ${d.verdict}`,
      `Doc A Safety Score: ${d.docASummary.score}/100 (${d.docASummary.trapsCount} traps)`,
      `Doc B Safety Score: ${d.docBSummary.score}/100 (${d.docBSummary.trapsCount} traps)`,
      `Risk Shift: ${d.scoreDelta > 0 ? '+' : ''}${d.scoreDelta} points`,
      ``,
      `CHANGES:`,
      ...d.changes.map((c, i) =>
        `\n[${i + 1}] ${c.type.toUpperCase()} — ${c.title}\nRisk: ${c.riskShift}\n${c.explanation}`
      )
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      if (window.app) window.app.showToast('📋 Redline report copied to clipboard!');
    });
  }
}

window.ContractComparatorUI = ContractComparatorUI;
