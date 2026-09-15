/**
 * What-If Legal Scenario Simulator
 * Evaluates hypothetical events against contractual clauses and calculates exposure.
 */

const RiskAnalyzer = require('./riskAnalyzer');

class ScenarioSimulator {
  static PRESET_SCENARIOS = [
    {
      id: "early_exit",
      title: "Early Lease / Contract Exit",
      category: "Termination",
      prompt: "What happens if I need to terminate this agreement 3 months early due to relocation or budget cuts?",
      triggerKeywords: ["early exit", "terminate early", "break lease", "cancel before", "leave early"]
    },
    {
      id: "late_payment",
      title: "Delayed Payment or Cash Flow Pause",
      category: "Payments",
      prompt: "What happens if a payment is delayed by 15 days? Will I incur penalties or immediate default?",
      triggerKeywords: ["late payment", "delayed payment", "grace period", "unpaid invoice", "late fee"]
    },
    {
      id: "unrepaired_damage",
      title: "Property Damage or Service Outage",
      category: "Breach & Warranty",
      prompt: "What are my legal remedies if the landlord/provider fails to repair essential infrastructure for 14 days?",
      triggerKeywords: ["repair", "habitability", "maintenance", "service outage", "downtime", "broken"]
    },
    {
      id: "side_business_ip",
      title: "Side Business / Secondary Work",
      category: "IP & Employment",
      prompt: "Does this contract restrict me from developing a personal software project or consulting on weekends?",
      triggerKeywords: ["side project", "moonlighting", "intellectual property", "inventions", "consulting outside"]
    }
  ];

  /**
   * Simulates a scenario against document clauses
   */
  static simulate(scenarioPrompt, documentText) {
    if (!scenarioPrompt || !documentText) {
      return {
        success: false,
        error: "Missing scenario prompt or document text"
      };
    }

    const analysis = RiskAnalyzer.analyze(documentText);
    const clauses = analysis.clauses;
    const q = scenarioPrompt.toLowerCase();

    // Find relevant clauses based on keyword overlap
    const relevantClauses = clauses.filter(c => {
      const cText = c.originalText.toLowerCase();
      if (q.includes('terminat') || q.includes('exit') || q.includes('leave') || q.includes('break')) {
        return c.category === 'Term & Exit Rights' || cText.includes('terminat') || cText.includes('cancel') || cText.includes('surrender');
      }
      if (q.includes('pay') || q.includes('fee') || q.includes('delay') || q.includes('invoice')) {
        return c.category === 'Financial & Payments' || cText.includes('late') || cText.includes('interest') || cText.includes('default');
      }
      if (q.includes('repair') || q.includes('damage') || q.includes('broken') || q.includes('outage')) {
        return c.category === 'Operational Duties' || cText.includes('repair') || cText.includes('habitability') || cText.includes('warranty');
      }
      if (q.includes('side') || q.includes('ip') || q.includes('project') || q.includes('work') || q.includes('invention')) {
        return c.category === 'Intellectual Property' || cText.includes('invention') || cText.includes('ownership') || cText.includes('non-compete');
      }
      return false;
    });

    // Fallback if no category match
    const activeClauses = relevantClauses.length > 0 ? relevantClauses : clauses.slice(0, 2);

    // Build structured simulation outcome
    let riskLevel = 'Moderate';
    let potentialPenalties = 'Standard contractual remedy or negotiation.';
    let requiredActions = ['Deliver written notice via certified email/mail', 'Reference specific clause section in communications'];
    let outcomeSummary = '';

    if (q.includes('terminat') || q.includes('exit') || q.includes('break')) {
      const hasLiquidated = analysis.traps.some(t => t.ruleId === 'liquidated_damages_penalty');
      if (hasLiquidated) {
        riskLevel = 'High Financial Risk';
        potentialPenalties = 'Potential loss of full deposit plus pre-defined liquidated termination fees.';
        requiredActions = [
          'Verify written notice window (typically 30-60 days prior)',
          'Request written agreement for mitigated re-letting or fee reduction',
          'Document condition with dated photographic evidence upon vacating'
        ];
        outcomeSummary = 'Terminating early triggers formal notice requirements and liquidated penalty clauses identified in the agreement.';
      } else {
        outcomeSummary = 'Early exit requires fulfilling stated notice period to avoid liability for remaining term payments.';
      }
    } else if (q.includes('pay') || q.includes('late')) {
      riskLevel = 'Moderate';
      potentialPenalties = 'Late fee assessment and potential default notice if not cured within cure period.';
      requiredActions = [
        'Notify counterparty in advance of delay to secure written extension',
        'Review cure period terms (standard 5 to 10 days before default declaration)'
      ];
      outcomeSummary = 'Delayed payment may incur specified late penalties unless proactive notice is submitted.';
    } else if (q.includes('repair') || q.includes('damage')) {
      riskLevel = 'Protective Remedy Available';
      potentialPenalties = 'Counterparty may be in breach of duty/warranty of habitability.';
      requiredActions = [
        'Send formal written repair request citing the maintenance clause',
        'Retain dated records and receipts of all communications and repair expenses',
        'Consult local statutory tenant/consumer protection laws before withholding any payments'
      ];
      outcomeSummary = 'Contractual terms and local statutory standards require prompt remediation of essential facilities.';
    } else {
      outcomeSummary = 'Scenario analyzed against pertinent contractual obligations and risk provisions.';
    }

    return {
      success: true,
      scenarioPrompt,
      outcomeSummary,
      riskLevel,
      potentialPenalties,
      requiredActions,
      relevantClauses: activeClauses.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        snippet: c.originalText.slice(0, 180) + '...'
      })),
      simulatedAt: new Date().toISOString()
    };
  }
}

module.exports = ScenarioSimulator;
