/**
 * LexiClarity - Attorney Consultation Packet Builder UI
 * Builds structured briefing packets to save legal fees and streamline consultations.
 */

class AttorneyPacketUI {
  static currentPacket = null;

  static init() {
    const generateBtn = document.getElementById('generatePacketBtn');
    const printBtn = document.getElementById('printPacketBtn');
    const copyMdBtn = document.getElementById('copyPacketMdBtn');

    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generatePacket());
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    if (copyMdBtn) {
      copyMdBtn.addEventListener('click', () => this.copyMarkdown());
    }
  }

  static async generatePacket() {
    const activeDoc = window.app.getActiveDocumentText();
    if (!activeDoc) {
      alert('Please upload or select a document in the Analyzer tab first.');
      window.app.switchTab('analyzerTab');
      return;
    }

    const clientName = document.getElementById('packetClientName').value.trim() || 'Client';
    const docTitle = document.getElementById('packetDocTitle').value.trim() || 'Agreement';
    const goal = document.getElementById('packetGoal').value.trim() || 'Pre-execution risk review';

    const previewArea = document.getElementById('packetPreviewArea');
    previewArea.classList.remove('hidden');
    previewArea.innerHTML = `<div class="loading-spinner">Compiling Attorney Consultation Packet...</div>`;

    try {
      const res = await fetch('/api/attorney-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: activeDoc,
          clientName,
          docTitle,
          goal
        })
      });

      const json = await res.json();
      if (json.success) {
        this.currentPacket = json.data;
        this.renderPacket(json.data);
      } else {
        previewArea.innerHTML = `<p class="error-msg">Packet generation failed: ${json.error}</p>`;
      }
    } catch (e) {
      previewArea.innerHTML = `<p class="error-msg">Network error: ${e.message}</p>`;
    }
  }

  static renderPacket(data) {
    const previewArea = document.getElementById('packetPreviewArea');
    if (!previewArea) return;

    previewArea.innerHTML = `
      <div class="packet-paper printable" id="printablePacket">
        <div class="packet-header-banner">
          <div class="packet-top-row">
            <span class="packet-stamp">CONFIDENTIAL LEGAL CONSULTATION BRIEF</span>
            <span class="packet-date">${new Date(data.generatedAt).toLocaleDateString()}</span>
          </div>
          <h2 class="packet-main-title">${data.title}</h2>
          <div class="packet-meta-grid">
            <div><strong>Client:</strong> ${data.clientName}</div>
            <div><strong>Document:</strong> ${data.docTitle}</div>
            <div><strong>Primary Goal:</strong> ${data.consultationGoal}</div>
            <div><strong>Calculated Safety:</strong> ${data.riskProfile.safetyScore}/100 (${data.riskProfile.grade})</div>
          </div>
        </div>

        <section class="packet-section">
          <h3 class="packet-sec-title">1. Executive Risk Assessment</h3>
          <p>
            This agreement has an overall safety score of <strong>${data.riskProfile.safetyScore}/100</strong>.
            LexiClarity AI identified <strong>${data.riskProfile.trapsCount} high-risk trap(s)</strong> that require legal counsel clarification before execution.
          </p>
        </section>

        <section class="packet-section">
          <h3 class="packet-sec-title">2. Targeted Questions for Legal Counsel</h3>
          <p class="packet-subtext">Focus on these specific points during your initial consultation to maximize billable hour efficiency:</p>
          <div class="packet-questions-list">
            ${data.questionsForCounsel.map((q, idx) => `
              <div class="packet-question-item">
                <div class="q-header">
                  <strong>Question ${idx + 1}: ${q.topic}</strong>
                  <span class="q-ref">Reference: ${q.clauseReference}</span>
                </div>
                <p class="q-body">"${q.question}"</p>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="packet-section">
          <h3 class="packet-sec-title">3. Flagged Clauses & Redlines</h3>
          <div class="packet-traps-list">
            ${data.flaggedTraps.map(trap => `
              <div class="packet-trap-item">
                <div class="trap-head">
                  <span class="trap-sev-tag ${trap.severity.toLowerCase()}">${trap.severity}</span>
                  <strong>${trap.title}</strong> (Location: ${trap.clauseTitle})
                </div>
                <p class="trap-extract"><em>"${trap.snippet}"</em></p>
                <p class="trap-prop"><strong>Proposed Negotiation:</strong> ${trap.recommendation}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="packet-section">
          <h3 class="packet-sec-title">4. Deadlines & Pre-Signing Checklist</h3>
          <ul class="packet-checklist-ul">
            ${data.actionChecklist.map(c => `
              <li><strong>[${c.priority} Priority]</strong> ${c.action} (Target: ${c.targetClause})</li>
            `).join('')}
          </ul>
        </section>

        <footer class="packet-footer">
          <p>Prepared via LexiClarity AI • Client Privilege Preparatory Document • Not formal legal representation.</p>
        </footer>
      </div>
    `;

    previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  static copyMarkdown() {
    if (!this.currentPacket || !this.currentPacket.markdownContent) {
      alert('Please generate the packet first.');
      return;
    }
    navigator.clipboard.writeText(this.currentPacket.markdownContent);
    window.app.showToast('Copied Attorney Packet as Markdown to clipboard!');
  }
}

window.AttorneyPacketUI = AttorneyPacketUI;
