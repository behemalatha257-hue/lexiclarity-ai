/**
 * LexiClarity - Obligation Timeline & Milestone Visualizer
 * Extracts contractual deadlines, notice windows, and generates .ics calendar files.
 */

class ObligationTimelineUI {
  static init() {
    const refreshBtn = document.getElementById('refreshTimelineBtn');
    const exportIcsBtn = document.getElementById('exportIcsBtn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.renderFromActiveDoc());
    }

    if (exportIcsBtn) {
      exportIcsBtn.addEventListener('click', () => this.exportCalendar());
    }
  }

  static renderFromActiveDoc() {
    const analysis = window.DocumentAnalyzerUI ? window.DocumentAnalyzerUI.currentAnalysis : null;
    const container = document.getElementById('timelineEventsContainer');
    if (!container) return;

    // 1. If we already have obligations, render them immediately
    if (analysis && analysis.obligations && analysis.obligations.length > 0) {
      this.renderTrack(analysis.obligations, container);
      return;
    }

    // 2. If active document text exists, auto-trigger analysis
    const docText = window.app ? window.app.getActiveDocumentText() : '';
    if (docText && docText.length > 20) {
      container.innerHTML = `
        <div class="compare-loading-state">
          <div class="compare-loading-ring"></div>
          <div class="compare-loading-text">
            <strong>Extracting legal milestones & notice deadlines...</strong>
            <span>Analyzing clauses for payment dates, renewal windows, and notice requirements</span>
          </div>
        </div>`;

      window.app.analyzeCurrentDocument().then(() => {
        const freshAnalysis = window.DocumentAnalyzerUI ? window.DocumentAnalyzerUI.currentAnalysis : null;
        if (freshAnalysis && freshAnalysis.obligations && freshAnalysis.obligations.length > 0) {
          this.renderTrack(freshAnalysis.obligations, container);
        } else {
          container.innerHTML = `
            <div class="empty-state-card" style="text-align:center; padding:2rem;">
              <p>No active obligations or notice deadlines found in this document text.</p>
              <div style="margin-top:1rem;">
                <button type="button" class="btn btn-primary btn-sm" onclick="ObligationTimelineUI.loadAndAnalyzeSample()">
                  📄 Load Sample Contract With Deadlines
                </button>
              </div>
            </div>`;
        }
      }).catch(err => {
        console.error('Timeline extraction error:', err);
        container.innerHTML = `
          <div class="empty-state-card" style="text-align:center; padding:2rem;">
            <p>No active obligations or notice deadlines found. Please analyze a document in the Analyzer tab first.</p>
            <div style="margin-top:1rem;">
              <button type="button" class="btn btn-primary btn-sm" onclick="ObligationTimelineUI.loadAndAnalyzeSample()">
                📄 Load Sample Contract With Deadlines
              </button>
            </div>
          </div>`;
      });
      return;
    }

    // 3. No document text loaded at all
    container.innerHTML = `
      <div class="empty-state-card" style="text-align:center; padding:2rem;">
        <p>No document loaded yet. Please load or paste a contract to extract deadlines and milestones.</p>
        <div style="margin-top:1rem;">
          <button type="button" class="btn btn-primary btn-sm" onclick="ObligationTimelineUI.loadAndAnalyzeSample()">
            📄 Load Sample Contract With Deadlines
          </button>
        </div>
      </div>`;
  }

  static loadAndAnalyzeSample() {
    if (window.app) {
      window.app.loadInitialSample();
      setTimeout(() => this.renderFromActiveDoc(), 500);
    }
  }

  static renderTrack(obligations, container) {
    container.innerHTML = `
      <div class="timeline-track">
        ${obligations.map((obl, idx) => `
          <div class="timeline-event-card">
            <div class="timeline-marker">
              <span class="marker-dot"></span>
              <span class="marker-step">${idx + 1}</span>
            </div>
            <div class="timeline-card-content">
              <div class="event-meta">
                <span class="event-type-badge">${obl.type}</span>
                <span class="event-timeframe">⏰ ${obl.timeframe}</span>
              </div>
              <h4 class="event-title">${obl.description}</h4>
              <p class="event-party">Responsible Party: <strong>${obl.party}</strong></p>
              <div class="event-actions">
                <button type="button" class="btn-sm btn-subtle" onclick="ObligationTimelineUI.downloadSingleReminder('${escape(obl.type)}', '${escape(obl.description)}')">
                  📅 Add to Calendar (.ics)
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  static async exportCalendar() {
    let analysis = window.DocumentAnalyzerUI ? window.DocumentAnalyzerUI.currentAnalysis : null;

    // If no obligations in cache yet, try to auto-analyze active document text
    if (!analysis || !analysis.obligations || analysis.obligations.length === 0) {
      const docText = window.app ? window.app.getActiveDocumentText() : '';
      if (docText && docText.length > 20) {
        if (window.app) window.app.showToast('⏳ Extracting deadlines from document before export...');
        try {
          await window.app.analyzeCurrentDocument();
          analysis = window.DocumentAnalyzerUI ? window.DocumentAnalyzerUI.currentAnalysis : null;
        } catch (err) {
          console.warn('Auto analysis for export failed:', err);
        }
      }
    }

    if (!analysis || !analysis.obligations || analysis.obligations.length === 0) {
      if (window.app) {
        window.app.showToast('⚠️ Please load or analyze a document first to export its calendar deadlines.');
      } else {
        alert('Please load or analyze a document first to export its calendar deadlines.');
      }
      return;
    }

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LexiClarity AI//Legal Obligation Calendar//EN'
    ];

    const today = new Date();
    analysis.obligations.forEach((obl, idx) => {
      const eventDate = new Date(today.getTime() + (idx + 1) * 7 * 24 * 60 * 60 * 1000);
      const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:lexi_${Date.now()}_${idx}@lexiclarity.ai`);
      icsContent.push(`DTSTAMP:${dateStr}`);
      icsContent.push(`DTSTART:${dateStr}`);
      icsContent.push(`SUMMARY:Legal Deadline: ${obl.type}`);
      icsContent.push(`DESCRIPTION:${obl.description} (Responsible: ${obl.party})`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LexiClarity_Legal_Deadlines_${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.app) {
      window.app.showToast(`✅ Downloaded Legal Obligation Calendar with ${analysis.obligations.length} deadlines!`);
    }
  }

  static downloadSingleReminder(type, desc) {
    const unescapedType = unescape(type);
    const unescapedDesc = unescape(desc);
    
    const eventDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LexiClarity AI//Legal Reminder//EN',
      'BEGIN:VEVENT',
      `UID:lexi_rem_${Date.now()}@lexiclarity.ai`,
      `DTSTAMP:${dateStr}`,
      `DTSTART:${dateStr}`,
      `SUMMARY:Legal Action: ${unescapedType}`,
      `DESCRIPTION:${unescapedDesc}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Legal_Reminder_${unescapedType.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.app) {
      window.app.showToast(`✅ Downloaded reminder for ${unescapedType}!`);
    }
  }
}

window.ObligationTimelineUI = ObligationTimelineUI;
