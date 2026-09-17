/**
 * LexiClarity - Document Analyzer & ClauseRadar UI
 * Renders risk scores, predatory trap cards, clause browsers, and pre-signing checklists.
 */

class DocumentAnalyzerUI {
  static currentAnalysis = null;
  static activeCategory = 'all';

  static render(analysisData) {
    this.currentAnalysis = analysisData;
    const container = document.getElementById('analysisResults');
    if (!container) return;

    container.classList.remove('hidden');

    // 1. Render Score Dial & Executive Metrics
    this.renderScoreDial(analysisData);

    // 2. Render Traps Matrix
    this.renderTrapsMatrix(analysisData.traps || []);

    // 3. Render Clause Breakdown
    this.renderClauses(analysisData.clauses || []);

    // 4. Render Action Checklist
    this.renderChecklist(analysisData.actionChecklist || []);

    // Scroll smoothly to results
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  static renderScoreDial(data) {
    const scoreVal = document.getElementById('scoreValue');
    const scoreGrade = document.getElementById('scoreGrade');
    const scoreBadge = document.getElementById('scoreBadge');
    const trapCountEl = document.getElementById('trapCountMetric');
    const clauseCountEl = document.getElementById('clauseCountMetric');
    const wordCountEl = document.getElementById('wordCountMetric');

    if (scoreVal) scoreVal.textContent = data.score;
    if (scoreGrade) scoreGrade.textContent = `Grade: ${data.grade}`;
    if (scoreBadge) {
      scoreBadge.textContent = data.riskLevel;
      scoreBadge.className = `badge risk-${data.grade.toLowerCase()}`;
    }

    if (trapCountEl) trapCountEl.textContent = data.trapsFoundCount || 0;
    if (clauseCountEl) clauseCountEl.textContent = (data.clauses || []).length;
    if (wordCountEl) wordCountEl.textContent = data.wordCount || 0;

    // Update circular progress SVG
    const circle = document.getElementById('scoreCircleProgress');
    if (circle) {
      const radius = circle.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (data.score / 100) * circumference;
      circle.style.strokeDashoffset = offset;
      
      // Color gradient based on score
      if (data.score >= 80) circle.style.stroke = 'var(--color-success)';
      else if (data.score >= 60) circle.style.stroke = 'var(--color-warning)';
      else circle.style.stroke = 'var(--color-danger)';
    }

    // Render AI Executive Summary if provided
    const aiBanner = document.getElementById('aiSummaryBanner');
    const aiText = document.getElementById('aiSummaryText');
    const aiProvider = document.getElementById('aiSummaryProvider');
    if (aiBanner && aiText) {
      if (data.aiSummary) {
        aiBanner.classList.remove('hidden');
        aiText.textContent = data.aiSummary;
        if (aiProvider && data.aiProvider) {
          aiProvider.textContent = data.aiProvider;
        }
      } else {
        aiBanner.classList.add('hidden');
      }
    }
  }

  static renderTrapsMatrix(traps) {
    const list = document.getElementById('trapsList');
    if (!list) return;

    if (traps.length === 0) {
      list.innerHTML = `
        <div class="empty-state-card success" style="background:var(--color-success-bg); border:1px solid var(--color-success-border); padding:1.5rem; border-radius:var(--radius-md); text-align:center;">
          <h4 style="color:var(--color-success); margin-bottom:0.25rem;">✅ No Predatory Traps Detected</h4>
          <p style="color:var(--text-secondary); font-size:0.9rem;">This agreement appears standard without obvious unilateral indemnity or evergreen lock-in clauses.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = traps.map((trap, idx) => `
      <div class="trap-card severity-${trap.severity.toLowerCase()}">
        <div class="trap-header">
          <span class="severity-badge ${trap.severity.toLowerCase()}">${trap.severity} RISK</span>
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${trap.category}</span>
        </div>
        <h4 class="trap-title">${idx + 1}. ${trap.title}</h4>
        <p class="trap-explanation">${trap.explanation}</p>
        
        <div class="trap-snippet">
          <div class="snippet-label">Identified in ${trap.clauseTitle}:</div>
          <blockquote>"${trap.snippet}"</blockquote>
        </div>

        <div class="trap-recommendation">
          <strong>💡 Recommended Counter-Proposal:</strong>
          <span>${trap.recommendation}</span>
        </div>

        <div class="trap-actions">
          <button type="button" class="btn-sm btn-outline" onclick="DocumentAnalyzerUI.requestRedlineByIndex(${idx})">
            Generate AI Counter-Proposal
          </button>
          <button type="button" class="btn-sm btn-subtle" onclick="DocumentAnalyzerUI.speakTrap(${idx})">
            🔊 Listen
          </button>
        </div>
      </div>
    `).join('');
  }

  static renderClauses(clauses) {
    const list = document.getElementById('clausesList');
    if (!list) return;

    const filtered = this.activeCategory === 'all' 
      ? clauses 
      : clauses.filter(c => c.category.toLowerCase().includes(this.activeCategory));

    if (filtered.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted); padding:1rem;">No clauses match the selected category.</p>`;
      return;
    }

    list.innerHTML = filtered.map((clause, idx) => `
      <div class="clause-card" id="clause-card-${clause.id}">
        <div class="clause-card-header">
          <div class="clause-meta">
            <span class="clause-id">Clause ${clause.clauseNumber}</span>
            <span class="clause-category-tag">${clause.category}</span>
          </div>
          <h4 style="font-size:1.05rem; font-weight:700; color:var(--text-primary);">${clause.title}</h4>
        </div>

        <div class="clause-plain-english">
          <div class="plain-english-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>Plain-English Meaning:</span>
          </div>
          <p style="font-size:0.92rem; color:var(--text-primary);">${clause.summary}</p>
        </div>

        <div class="clause-original-toggle">
          <details>
            <summary style="cursor:pointer; font-size:0.82rem; font-weight:600; color:var(--color-brand); margin-bottom:0.4rem;">View Original Legal Text</summary>
            <pre class="legal-text-block">${clause.originalText}</pre>
          </details>
        </div>

        <div class="clause-actions" style="margin-top:0.75rem; display:flex; gap:0.5rem;">
          <button type="button" class="btn-sm btn-subtle" onclick="DocumentAnalyzerUI.speakClauseSummary(${clause.clauseNumber})">
            🔊 Listen to Plain English
          </button>
          <button type="button" class="btn-sm btn-subtle" onclick="DocumentAnalyzerUI.askAboutClause('${encodeURIComponent(clause.title)}')">
            💬 Ask AI Question
          </button>
        </div>
      </div>
    `).join('');
  }

  static filterClauses(category) {
    this.activeCategory = category.toLowerCase();
    
    // Update filter tabs
    document.querySelectorAll('.clause-filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });

    if (this.currentAnalysis) {
      this.renderClauses(this.currentAnalysis.clauses || []);
    }
  }

  static renderChecklist(items) {
    const container = document.getElementById('checklistItems');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);">No pending actions required.</p>`;
      return;
    }

    container.innerHTML = items.map((item, idx) => `
      <div class="checklist-item" id="chk-item-${item.id}">
        <label class="custom-checkbox">
          <input type="checkbox" onchange="DocumentAnalyzerUI.toggleChecklistItem('${item.id}')">
          <span class="checkmark"></span>
          <div class="checklist-content" style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <span class="priority-pill ${item.priority.toLowerCase()}">${item.priority} Priority</span>
              <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${item.targetClause}</span>
            </div>
            <span style="font-size:0.92rem; color:var(--text-primary); font-weight:500;">${item.action}</span>
          </div>
        </label>
      </div>
    `).join('');
  }

  static toggleChecklistItem(id) {
    const el = document.getElementById(`chk-item-${id}`);
    if (el) el.classList.toggle('completed');
  }

  static askAboutClause(encodedTitle) {
    const title = decodeURIComponent(encodedTitle);
    window.app.switchTab('chatTab');
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = `Can you explain the practical risks and next steps regarding "${title}" in plain English?`;
      input.focus();
    }
  }

  static speakTrap(idx) {
    if (this.currentAnalysis && this.currentAnalysis.traps && this.currentAnalysis.traps[idx]) {
      const t = this.currentAnalysis.traps[idx];
      window.accessibility.speakText(`${t.title}. ${t.explanation}. Recommendation: ${t.recommendation}`);
    }
  }

  static speakClauseSummary(clauseNum) {
    if (this.currentAnalysis && this.currentAnalysis.clauses) {
      const c = this.currentAnalysis.clauses.find(item => item.clauseNumber === clauseNum);
      if (c) {
        window.accessibility.speakText(`Clause ${c.clauseNumber}: ${c.title}. Meaning: ${c.summary}`);
      }
    }
  }

  static async requestRedlineByIndex(idx) {
    if (!this.currentAnalysis || !this.currentAnalysis.traps || !this.currentAnalysis.traps[idx]) return;
    const trap = this.currentAnalysis.traps[idx];
    const snippet = trap.snippet;

    const modal = document.getElementById('redlineModal');
    const modalContent = document.getElementById('redlineModalContent');
    if (!modal || !modalContent) return;

    modal.classList.remove('hidden');
    modalContent.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--color-brand); font-weight:600;">Generating balanced counter-proposal redline...</div>`;

    try {
      const res = await fetch('/api/redline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauseText: snippet,
          objective: 'Make mutual, cap liability, and add reasonable notice period'
        })
      });
      const data = await res.json();
      if (data.success) {
        modalContent.innerHTML = `
          <div class="redline-result">
            <div style="margin-bottom:1rem; background:var(--bg-inset); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.35rem;">Original Wording:</h4>
              <p style="font-size:0.9rem; color:var(--text-secondary); font-style:italic;">"${snippet}"</p>
            </div>
            <div style="margin-bottom:1.5rem; background:var(--color-success-bg); border:1px solid var(--color-success-border); padding:1rem; border-radius:var(--radius-md);">
              <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--color-success); margin-bottom:0.35rem;">Proposed Balanced Redline:</h4>
              <div class="redline-output-box" style="font-size:0.92rem; color:var(--text-primary); line-height:1.6;">${data.data.redlineText.replace(/\n/g, '<br>')}</div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
              <button type="button" class="btn-primary" onclick="DocumentAnalyzerUI.copyRedlineText()">📋 Copy Proposed Redline</button>
              <button type="button" class="btn-secondary" onclick="DocumentAnalyzerUI.closeRedlineModal()">Close</button>
            </div>
          </div>
        `;
      }
    } catch (e) {
      modalContent.innerHTML = `<p style="color:var(--color-danger);">Failed to generate redline: ${e.message}</p>`;
    }
  }

  static copyRedlineText() {
    const box = document.querySelector('.redline-output-box');
    if (box) {
      navigator.clipboard.writeText(box.innerText);
      window.app.showToast('Copied redline proposal to clipboard!');
    }
  }

  static closeRedlineModal() {
    const modal = document.getElementById('redlineModal');
    if (modal) modal.classList.add('hidden');
  }
}

window.DocumentAnalyzerUI = DocumentAnalyzerUI;
