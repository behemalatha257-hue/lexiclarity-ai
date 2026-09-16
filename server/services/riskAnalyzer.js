/**
 * ClauseRadar™ - Legal Risk & Trap Analyzer Service
 * Clause segmentation, trap detection, liability scoring, and actionable checklist generation.
 */

class RiskAnalyzer {
  static TRAP_RULES = [
    {
      id: "unilateral_indemnity",
      title: "Unilateral Indemnification Trap",
      category: "Liability & Damages",
      severity: "CRITICAL",
      scorePenalty: 25,
      regex: /(indemnify|hold harmless|defend)[\s\S]{1,120}(solely|client|landlord|company|disclosing party)[\s\S]{0,80}(all claims|any and all losses|attorney'?s? fees)/i,
      explanation: "You bear 100% financial and legal responsibility for their third-party lawsuits and attorney fees without any reciprocal protection.",
      recommendation: "Demand mutual indemnification or cap your liability strictly to the fees paid under this agreement."
    },
    {
      id: "mandatory_arbitration_waiver",
      title: "Mandatory Arbitration & Class Action Ban",
      category: "Dispute Resolution",
      severity: "HIGH",
      scorePenalty: 18,
      regex: /(binding arbitration|waive.*right to (a )?jury|class action waiver|solely by arbitration)/i,
      explanation: "You forfeit your constitutional right to take disputes to public court, sue in front of a jury, or join fellow affected individuals in a class action.",
      recommendation: "Request standard local court jurisdiction or ensure the other party covers all arbitration filing fees."
    },
    {
      id: "stealth_auto_renewal",
      title: "Stealth Auto-Renewal / Evergreen Lock-in",
      category: "Term & Termination",
      severity: "HIGH",
      scorePenalty: 20,
      regex: /(automatically renew|automatic renewal|evergreen|successive (?:periods|terms|years|\d+-month periods)|\brenewed without notice\b)[\s\S]{0,300}(?:unless|prior to|before|written notice)[\s\S]{0,100}\b(30|45|60|90)\s*days/i,
      explanation: "The contract locks you in for another full term unless you deliver written cancellation within an easily missed narrow window.",
      recommendation: "Change to month-to-month continuation or require 30-day email reminder notice before auto-renewal triggers."
    },
    {
      id: "unilateral_modification",
      title: "Unilateral Modification Right",
      category: "Contract Terms",
      severity: "CRITICAL",
      scorePenalty: 22,
      regex: /(modify|alter|change|amend)[\s\S]{1,60}(at any time|sole discretion|without prior notice|by posting on)/i,
      explanation: "The other party reserves the right to change contract terms, fees, or obligations at will without your explicit written consent.",
      recommendation: "Require written mutual consent signed by both parties for any amendments."
    },
    {
      id: "liquidated_damages_penalty",
      title: "Excessive Liquidated Damages / Penalties",
      category: "Financial Penalties",
      severity: "HIGH",
      scorePenalty: 16,
      regex: /(liquidated damages|early termination fee|penalty fee|forfeit.*deposit)[\s\S]{1,80}(\$[\d,]+|\b\d{1,2}\s*months|\bentire remaining balance\b)/i,
      explanation: "Imposes an aggressive fixed financial penalty or forfeiture of your deposit upon early departure or technical breach.",
      recommendation: "Negotiate a pro-rated termination fee capped at 1 month or actual documented losses."
    },
    {
      id: "unlimited_liability",
      title: "No Limitation of Liability / Unlimited Exposure",
      category: "Liability & Damages",
      severity: "HIGH",
      scorePenalty: 15,
      regex: /(shall not be limited|no limitation on liability|unlimited liability)/i,
      explanation: "Leaves you exposed to unbounded consequential, punitive, or indirect financial damages.",
      recommendation: "Add standard limitation of liability capping claims to fees paid in the preceding 6 to 12 months."
    },
    {
      id: "broad_ip_assignment",
      title: "Overreaching Intellectual Property Assignment",
      category: "Intellectual Property",
      severity: "HIGH",
      scorePenalty: 18,
      regex: /(all inventions|all rights, title|irrevocably assigns?|perpetual worldwide assignment)[\s\S]{0,100}(whether or not related|outside working hours|all prior works)/i,
      explanation: "Claims ownership of your personal side projects, prior creations, or work performed outside billable duties.",
      recommendation: "Carve out pre-existing IP and explicitly limit assignment strictly to deliverables produced under this engagement."
    },
    {
      id: "acceleration_clause",
      title: "Accelerated Rent / Debt Due Upon Default",
      category: "Financial Penalties",
      severity: "MEDIUM",
      scorePenalty: 12,
      regex: /(accelerate|immediate due and payable|entire remaining rent for the remainder of the term)/i,
      explanation: "A single late payment or breach makes the entire multi-year contract value due immediately in one lump sum.",
      recommendation: "Add a mandatory 10-15 day written notice and cure period before any default acceleration can occur."
    }
  ];

  /**
   * Sanitizes binary and XML artifacts if Word docx was passed as raw text
   */
  static cleanText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let cleaned = rawText;

    // Extract text from <w:t> tags if raw docx XML was uploaded
    if (cleaned.includes('[Content_Types].xml') || cleaned.includes('<w:t') || cleaned.includes('word/document.xml')) {
      const matches = cleaned.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/gi);
      if (matches && matches.length > 0) {
        cleaned = matches.map(tag => tag.replace(/<[^>]+>/g, '')).join(' ');
      }
    }

    // Remove PK binary headers & null control characters
    cleaned = cleaned.replace(/^PK[\s\S]*?\[Content_Types\]\.xml[\s\S]*?(?=[A-Z0-9]{3,})/i, '');
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return cleaned;
  }

  /**
   * Performs deep analysis of document text
   */
  static analyze(documentText, options = {}) {
    if (!documentText || typeof documentText !== 'string') {
      return {
        score: 0,
        grade: 'F',
        riskLevel: 'Unknown',
        traps: [],
        clauses: [],
        obligations: [],
        actionChecklist: [],
        summary: 'No document text provided.'
      };
    }

    const text = this.cleanText(documentText);
    const clauses = this.segmentClauses(text);
    const traps = this.detectTraps(text, clauses);
    const obligations = this.extractObligations(clauses);
    const actionChecklist = this.generateActionChecklist(traps, obligations);

    // Compute Safety Score (0-100): 100 = Fair & Safe, 0 = Extremely Risky
    let penaltyTotal = 0;
    traps.forEach(trap => {
      penaltyTotal += trap.scorePenalty;
    });

    const score = Math.max(15, Math.min(100, 100 - penaltyTotal));
    let grade = 'A';
    let riskLevel = 'Low Risk';

    if (score < 40) {
      grade = 'F';
      riskLevel = 'Extreme Risk';
    } else if (score < 60) {
      grade = 'D';
      riskLevel = 'High Risk';
    } else if (score < 75) {
      grade = 'C';
      riskLevel = 'Moderate Risk';
    } else if (score < 90) {
      grade = 'B';
      riskLevel = 'Fair / Minor Notes';
    }

    const categoryBreakdown = this.getCategoryBreakdown(traps, clauses);

    return {
      score,
      grade,
      riskLevel,
      trapsFoundCount: traps.length,
      traps,
      clauses,
      obligations,
      actionChecklist,
      categoryBreakdown,
      wordCount: text.split(/\s+/).length,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Splits text into identifiable clauses/sections
   */
  static segmentClauses(text) {
    const rawSections = text.split(/(?=\n(?:\d+[\.\)]|[A-Z][A-Z\s]{3,30}:|Section\s+\d+|Article\s+\d+|CLAUSE\s+\d+))/gi);
    
    return rawSections
      .map((sec, idx) => {
        const clean = sec.trim();
        if (clean.length < 20) return null;

        const firstLine = clean.split('\n')[0].replace(/^[\d\.\)\s]+/, '').trim();
        const title = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
        
        let category = 'General Terms';
        const lower = clean.toLowerCase();
        if (lower.includes('rent') || lower.includes('payment') || lower.includes('fee') || lower.includes('invoice')) {
          category = 'Financial & Payments';
        } else if (lower.includes('terminat') || lower.includes('renew') || lower.includes('duration') || lower.includes('term')) {
          category = 'Term & Exit Rights';
        } else if (lower.includes('indemn') || lower.includes('liabilit') || lower.includes('damages') || lower.includes('hold harmless')) {
          category = 'Liability & Indemnity';
        } else if (lower.includes('arbitrat') || lower.includes('dispute') || lower.includes('governing law') || lower.includes('court')) {
          category = 'Dispute Resolution';
        } else if (lower.includes('intellectual property') || lower.includes('invention') || lower.includes('copyright') || lower.includes('work for hire')) {
          category = 'Intellectual Property';
        } else if (lower.includes('confidential') || lower.includes('privacy') || lower.includes('data')) {
          category = 'Confidentiality & Privacy';
        } else if (lower.includes('maintenance') || lower.includes('repair') || lower.includes('habitability') || lower.includes('service level')) {
          category = 'Operational Duties';
        }

        return {
          id: `clause_${idx + 1}`,
          clauseNumber: idx + 1,
          title: title || `Clause ${idx + 1}`,
          category,
          originalText: clean,
          summary: this.generateClauseSummary(clean, category)
        };
      })
      .filter(Boolean);
  }

  /**
   * Generates a concise plain-English explanation for a clause
   */
  static generateClauseSummary(clauseText, category) {
    const lower = clauseText.toLowerCase();
    if (lower.includes('indemnif')) {
      return 'Requires compensation/payment for losses, third-party lawsuits, or legal expenses.';
    }
    if (lower.includes('auto') && lower.includes('renew')) {
      return 'Automatically extends the contract duration unless timely written notice is delivered.';
    }
    if (lower.includes('arbitrat')) {
      return 'Forces dispute resolution via private arbitrator instead of a public court and jury.';
    }
    if (lower.includes('liquidated')) {
      return 'Defines a fixed financial penalty payable immediately upon default or early termination.';
    }
    if (lower.includes('deposit')) {
      return 'Outlines security deposit holding conditions, refund timelines, and deduction rules.';
    }
    if (lower.includes('work for hire') || lower.includes('all inventions')) {
      return 'Transfers intellectual property and deliverable ownership entirely to the hiring party.';
    }
    return `Covers standard ${category.toLowerCase()} operational parameters and mutual commitments.`;
  }

  /**
   * Scans text for dangerous traps using rule matching
   */
  static detectTraps(text, clauses) {
    const detected = [];

    for (const rule of this.TRAP_RULES) {
      const match = text.match(rule.regex);
      if (match) {
        // Find which clause contains this trap
        const matchedSnippet = match[0];
        const parentClause = clauses.find(c => c.originalText.includes(matchedSnippet)) || clauses[0];

        detected.push({
          ruleId: rule.id,
          title: rule.title,
          category: rule.category,
          severity: rule.severity,
          scorePenalty: rule.scorePenalty,
          snippet: matchedSnippet.length > 220 ? matchedSnippet.slice(0, 217) + '...' : matchedSnippet,
          clauseId: parentClause ? parentClause.id : null,
          clauseTitle: parentClause ? parentClause.title : 'General Terms',
          explanation: rule.explanation,
          recommendation: rule.recommendation
        });
      }
    }

    return detected;
  }

  /**
   * Extracts actionable obligations with timelines and notice periods
   */
  static extractObligations(clauses) {
    const obligations = [];

    clauses.forEach(clause => {
      const text = clause.originalText;
      const lower = text.toLowerCase();

      // Check for notice periods (e.g. 60 days prior to expiration, 30 days written notice)
      const noticeMatch = text.match(/(\d{1,3})\s*(?:business\s*)?days(?:\s*(?:written\s*)?notice|\s*prior\s*to|\s*in\s*advance)/i);
      if (noticeMatch) {
        obligations.push({
          type: 'Notice Deadline',
          timeframe: `${noticeMatch[1]} Days`,
          description: `Deliver written notice before exercising rights under "${clause.title}".`,
          clauseId: clause.id,
          party: lower.includes('tenant') || lower.includes('contractor') ? 'You' : 'Mutual / Counterparty'
        });
      }

      // Check for payment terms (e.g. due on or before the 1st, payable within 30 days, net-60)
      const payMatch = text.match(/(?:due\s+on\s+or\s+before|payable\s+within|net[- ]?)\s*(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?|\d{1,2}\s*days)/i);
      if (payMatch) {
        obligations.push({
          type: 'Payment Schedule',
          timeframe: payMatch[1],
          description: `Submit scheduled payment as stipulated in "${clause.title}".`,
          clauseId: clause.id,
          party: 'You'
        });
      }

      // Check for maintenance or repairs duties
      if (lower.includes('responsible for') && (lower.includes('maintenance') || lower.includes('repairs') || lower.includes('deliverables'))) {
        obligations.push({
          type: 'Operational Responsibility',
          timeframe: 'Ongoing',
          description: `Fulfill maintenance or service deliverables stipulated in "${clause.title}".`,
          clauseId: clause.id,
          party: 'You'
        });
      }

      // Check for confidentiality / return of materials
      if (lower.includes('return') && (lower.includes('confidential') || lower.includes('property'))) {
        obligations.push({
          type: 'Asset Return / Compliance',
          timeframe: 'Upon Termination',
          description: `Return or certify destruction of proprietary documents and assets.`,
          clauseId: clause.id,
          party: 'You'
        });
      }
    });

    return obligations;
  }

  /**
   * Generates a step-by-step checklist to protect the user before signing
   */
  static generateActionChecklist(traps, obligations) {
    const checklist = [];

    traps.forEach((trap, i) => {
      checklist.push({
        id: `chk_trap_${i + 1}`,
        priority: trap.severity === 'CRITICAL' ? 'High' : 'Medium',
        action: `Request amendment: ${trap.recommendation}`,
        targetClause: trap.clauseTitle,
        status: 'pending'
      });
    });

    obligations.forEach((obl, i) => {
      checklist.push({
        id: `chk_obl_${i + 1}`,
        priority: 'Medium',
        action: `Set calendar reminder for: ${obl.type} (${obl.timeframe})`,
        targetClause: obl.description,
        status: 'pending'
      });
    });

    checklist.push({
      id: 'chk_backup',
      priority: 'Low',
      action: 'Download and save a signed, dated copy in secure local storage.',
      targetClause: 'All Sections',
      status: 'pending'
    });

    return checklist;
  }

  /**
   * Aggregates category stats for risk charts
   */
  static getCategoryBreakdown(traps, clauses) {
    const categories = ['Liability & Damages', 'Term & Termination', 'Dispute Resolution', 'Financial Penalties', 'Intellectual Property', 'General Terms'];
    return categories.map(cat => {
      const trapCount = traps.filter(t => t.category === cat).length;
      const clauseCount = clauses.filter(c => c.category === cat).length;
      return {
        category: cat,
        trapCount,
        clauseCount,
        health: trapCount === 0 ? 'Safe' : (trapCount === 1 ? 'Warning' : 'Critical')
      };
    });
  }
}

module.exports = RiskAnalyzer;
