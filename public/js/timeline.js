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
    const analysis = window.DocumentAnalyzerUI.currentAnalysis;
    const container = document.getElementById('timelineEventsContainer');
    if (!container) return;

    // If no analysis yet, attempt to analyze first
    if (!analysis || !analysis.obligations || analysis.obligations.length === 0) {
      const docText = window.app ? window.app.getActiveDocumentText() : '';
      if (docText && docText.length > 30 && !analysis) {
        container.innerHTML = `<div class="compare-loading-state"><div class="compare-loading-ring"></div><div class="compare-loading-text"><strong>Extracting obligations from document...</strong></div></div>`;
        window.app.analyzeCurrentDocument().then(() => {
          const freshAnalysis = window.DocumentAnalyzerUI.currentAnalysis;
          if (freshAnalysis && freshAnalysis.obligations && freshAnalysis.obligations.length > 0) {
            this.renderFromActiveDoc();
          } else {
            container.innerHTML = `<div class="empty-state-card"><p>No recurring deadlines or notice obligations detected in this document.</p></div>`;
          }
        }).catch(() => {
          container.innerHTML = `<div class="empty-state-card"><p>No active obligations or notice deadlines found. Please analyze a document in the Analyzer tab first.</p></div>`;
        });
        return;
      }

      container.innerHTML = `
        <div class="empty-state-card">
          <p>No active obligations or notice deadlines found. Please analyze a document in the Analyzer tab first.</p>
        </div>
      `;
      return;
    }


    const obligations = analysis.obligations;

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

  static exportCalendar() {
    const analysis = window.DocumentAnalyzerUI.currentAnalysis;
    if (!analysis || !analysis.obligations || analysis.obligations.length === 0) {
      alert('No obligations found to export.');
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

    window.app.showToast('Downloaded Legal Obligation Calendar (.ics)!');
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

    window.app.showToast(`Downloaded reminder for ${unescapedType}!`);
  }
}

window.ObligationTimelineUI = ObligationTimelineUI;
