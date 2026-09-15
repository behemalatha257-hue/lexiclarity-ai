/**
 * Attorney Consultation Packet Generator
 * Generates an executive legal briefing, flagged clause extracts, and high-impact questions for legal counsel.
 */

const RiskAnalyzer = require('./riskAnalyzer');
const PiiSanitizer = require('./piiSanitizer');

class AttorneyPacketGenerator {
  /**
   * Builds an attorney briefing packet from analyzed document text
   */
  static generatePacket(documentText, metadata = {}) {
    // 1. Sanitize text first for privacy
    const piiResult = PiiSanitizer.sanitize(documentText);
    const analysis = RiskAnalyzer.analyze(piiResult.sanitizedText);

    const clientName = metadata.clientName || 'Client';
    const docTitle = metadata.docTitle || 'Legal Agreement / Contract';
    const consultationGoal = metadata.goal || 'General review and risk minimization prior to execution';

    // 2. Formulate targeted questions for legal counsel
    const questionsForCounsel = [];

    analysis.traps.forEach(trap => {
      if (trap.ruleId === 'unilateral_indemnity') {
        questionsForCounsel.push({
          topic: 'Indemnification Scope',
          question: 'Can we strike or narrow this unilateral indemnity clause to make it strictly mutual and capped at direct damages?',
          clauseReference: trap.clauseTitle
        });
      } else if (trap.ruleId === 'mandatory_arbitration_waiver') {
        questionsForCounsel.push({
          topic: 'Dispute Jurisdiction',
          question: 'Does the mandatory arbitration clause impose unreasonable filing fees or an unfavorable venue?',
          clauseReference: trap.clauseTitle
        });
      } else if (trap.ruleId === 'stealth_auto_renewal') {
        questionsForCounsel.push({
          topic: 'Auto-Renewal Window',
          question: 'What is the standard procedure in our jurisdiction to serve effective non-renewal notice without triggering evergreen renewal?',
          clauseReference: trap.clauseTitle
        });
      } else if (trap.ruleId === 'broad_ip_assignment') {
        questionsForCounsel.push({
          topic: 'IP Carve-Out',
          question: 'How can we append an Exhibit A listing pre-existing intellectual property to prevent overreaching ownership claims?',
          clauseReference: trap.clauseTitle
        });
      } else {
        questionsForCounsel.push({
          topic: trap.title,
          question: `What is the risk exposure of the "${trap.title}" clause, and what specific redline phrasing do you recommend?`,
          clauseReference: trap.clauseTitle
        });
      }
    });

    if (questionsForCounsel.length === 0) {
      questionsForCounsel.push({
        topic: 'Standard Boilerplate',
        question: 'Are there any non-standard governing law or termination stipulations we should negotiate?',
        clauseReference: 'General Terms'
      });
    }

    // 3. Generate Markdown and structured payload
    const markdown = this.formatMarkdown({
      clientName,
      docTitle,
      consultationGoal,
      analysis,
      piiResult,
      questionsForCounsel
    });

    return {
      title: `Attorney Briefing: ${docTitle}`,
      generatedAt: new Date().toISOString(),
      clientName,
      docTitle,
      consultationGoal,
      privacyStatus: {
        piiDetected: piiResult.piiDetectedCount,
        privacyScore: piiResult.privacyScore
      },
      riskProfile: {
        safetyScore: analysis.score,
        grade: analysis.grade,
        riskLevel: analysis.riskLevel,
        trapsCount: analysis.trapsFoundCount
      },
      flaggedTraps: analysis.traps,
      keyObligations: analysis.obligations,
      questionsForCounsel,
      actionChecklist: analysis.actionChecklist,
      markdownContent: markdown
    };
  }

  /**
   * Formats the briefing packet as clean Markdown
   */
  static formatMarkdown(data) {
    const { clientName, docTitle, consultationGoal, analysis, questionsForCounsel } = data;

    return `# Legal Consultation Briefing Packet
**Prepared for:** ${clientName}
**Document Title:** ${docTitle}
**Primary Objective:** ${consultationGoal}
**Date of Assessment:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Risk Evaluation:** ${analysis.score}/100 (Grade: ${analysis.grade} - ${analysis.riskLevel})

---

## 1. Executive Summary
This document has been parsed and evaluated for structural risk, hidden obligations, and non-standard provisions. The overall safety rating is **${analysis.score}/100**, with **${analysis.trapsFoundCount} high-priority risk factor(s)** detected.

## 2. Critical Red Flags & Identified Traps
${analysis.traps.length > 0 ? analysis.traps.map((t, idx) => `
### ${idx + 1}. ${t.title} [${t.severity}]
- **Location:** ${t.clauseTitle}
- **Issue:** ${t.explanation}
- **Original Extract:** > "${t.snippet}"
- **Suggested Negotiation:** ${t.recommendation}
`).join('\n') : '_No critical predatory clauses detected._'}

## 3. High-Impact Questions for Legal Counsel
_Use these questions during your consultation to save billable time and focus on key exposures:_
${questionsForCounsel.map((q, idx) => `
${idx + 1}. **${q.topic}** (Ref: *${q.clauseReference}*)
   *Question:* ${q.question}
`).join('\n')}

## 4. Key Notice & Obligation Deadlines
${analysis.obligations.length > 0 ? analysis.obligations.map((o, idx) => `
- **${o.type}** (${o.timeframe}): ${o.description} [Party: ${o.party}]
`).join('\n') : '_No special notice deadlines flagged._'}

## 5. Pre-Signing Checklist
${analysis.actionChecklist.map((c, idx) => `
- [ ] **[${c.priority} Priority]** ${c.action}
`).join('\n')}

---
*Notice: This briefing packet is generated for preparatory and informational purposes to streamline consultation with a qualified legal professional and does not constitute formal legal representation.*
`;
  }
}

module.exports = AttorneyPacketGenerator;
