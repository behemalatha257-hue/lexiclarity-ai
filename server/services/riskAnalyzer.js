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
      regex: /(?:indemnif(?:y|ies|ication)|hold\s+harmless|defend\s+and\s+indemnify)[\s\S]{1,160}?(?:solely|client|landlord|company|disclosing\s+party|licensor|vendor|against\s+any|from\s+any\s+and\s+all|regardless\s+of|all\s+claims|any\s+and\s+all\s+losses|attorney'?s?\s+fees)/i,
      explanation: "You bear 100% financial and legal responsibility for third-party lawsuits and attorney fees without reciprocal protection.",
      recommendation: "Demand mutual indemnification or cap your liability strictly to fees paid under this agreement."
    },
    {
      id: "mandatory_arbitration_waiver",
      title: "Mandatory Arbitration & Class Action Ban",
      category: "Dispute Resolution",
      severity: "HIGH",
      scorePenalty: 18,
      regex: /(?:binding\s+arbitration|arbitration\s+administered\s+by|waive.*right\s+to\s+(?:a\s+)?jury|class\s+action\s+waiver|solely\s+by\s+arbitration|jury\s+trial\s+waiver)/i,
      explanation: "You forfeit your constitutional right to take disputes to public court, sue before a jury, or join a class action.",
      recommendation: "Request standard local court jurisdiction or ensure the other party covers all arbitration filing fees."
    },
    {
      id: "stealth_auto_renewal",
      title: "Stealth Auto-Renewal / Evergreen Lock-in",
      category: "Term & Termination",
      severity: "HIGH",
      scorePenalty: 20,
      regex: /(?:automatically\s+renew|automatic\s+renewal|evergreen|successive\s+(?:periods|terms|years|\d+-month\s+periods)|\brenewed\s+without\s+notice\b)[\s\S]{0,300}?(?:unless|prior\s+to|before|written\s+notice)[\s\S]{0,100}?\b(30|45|60|90|\d+)\s*days/i,
      explanation: "The contract locks you in for another full term unless you deliver written cancellation within an easily missed narrow window.",
      recommendation: "Change to month-to-month continuation or require 30-day email reminder notice before auto-renewal triggers."
    },
    {
      id: "unilateral_modification",
      title: "Unilateral Modification Right",
      category: "Contract Terms",
      severity: "CRITICAL",
      scorePenalty: 22,
      regex: /(?:modify|alter|change|amend|update)[\s\S]{1,80}?(?:at\s+any\s+time|sole\s+discretion|without\s+(?:prior\s+)?notice|by\s+posting|from\s+time\s+to\s+time\s+without)/i,
      explanation: "The counterparty reserves the right to change contract terms, fees, or obligations at will without your explicit written consent.",
      recommendation: "Require written mutual consent signed by both parties for any amendments."
    },
    {
      id: "liquidated_damages_penalty",
      title: "Excessive Liquidated Damages / Penalties",
      category: "Financial Penalties",
      severity: "HIGH",
      scorePenalty: 16,
      regex: /(?:liquidated\s+damages|early\s+termination\s+fee|penalty\s+fee|forfeit(?:s|ure)?\s+(?:the\s+entire\s+|all\s+)?deposit|re-letting\s+costs?|cancellation\s+charge)[\s\S]{0,120}?(?:\$[\d,]+|\b\d{1,2}\s*months|\bentire\s+remaining\s+balance\b|in\s+addition\s+to)/i,
      explanation: "Imposes an aggressive fixed financial penalty or forfeiture of your deposit upon early departure or technical breach.",
      recommendation: "Negotiate a pro-rated termination fee capped at 1 month or actual documented losses."
    },
    {
      id: "unlimited_liability",
      title: "No Limitation of Liability / Unlimited Exposure",
      category: "Liability & Damages",
      severity: "HIGH",
      scorePenalty: 15,
      regex: /(?:shall\s+not\s+be\s+limited|no\s+limitation\s+(?:of|on)\s+liability|unlimited\s+liability|disclaims\s+all\s+liability|sole\s+and\s+exclusive\s+remedy)/i,
      explanation: "Leaves you exposed to unbounded consequential, punitive, or indirect financial damages.",
      recommendation: "Add standard limitation of liability capping claims to fees paid in the preceding 6 to 12 months."
    },
    {
      id: "broad_ip_assignment",
      title: "Overreaching Intellectual Property Assignment",
      category: "Intellectual Property",
      severity: "HIGH",
      scorePenalty: 18,
      regex: /(?:all\s+inventions|all\s+rights,?\s*title|irrevocably\s+assigns?|perpetual\s+worldwide\s+assignment|work\s+(?:made\s+)?for\s+hire)[\s\S]{0,120}?(?:whether\s+or\s+not\s+related|outside\s+working\s+hours|all\s+prior\s+works|personal\s+time|sole\s+and\s+exclusive\s+property)/i,
      explanation: "Claims ownership of your personal side projects, prior creations, or work performed outside billable duties.",
      recommendation: "Carve out pre-existing IP and explicitly limit assignment strictly to deliverables produced under this engagement."
    },
    {
      id: "acceleration_clause",
      title: "Accelerated Rent / Debt Due Upon Default",
      category: "Financial Penalties",
      severity: "MEDIUM",
      scorePenalty: 12,
      regex: /(?:accelerate[s]?|immediate(?:ly)?\s+due\s+and\s+payable|entire\s+remaining\s+rent\s+for\s+the\s+remainder\s+of\s+the\s+term|entire\s+remaining\s+balance)/i,
      explanation: "A single late payment or breach makes the entire multi-year contract value due immediately in one lump sum.",
      recommendation: "Add a mandatory 10-15 day written notice and cure period before any default acceleration can occur."
    },
    {
      id: "non_compete_non_solicit",
      title: "Aggressive Non-Compete & Client Lockout",
      category: "Restrictive Covenants",
      severity: "HIGH",
      scorePenalty: 18,
      regex: /(?:non-solicit(?:ation)?|shall\s+not\s+(?:directly\s+or\s+indirectly\s+)?solicit|covenant\s+not\s+to\s+compete|non-competition|not\s+do\s+business\s+with\s+any\s+client|restrict(?:ed)?\s+from\s+engaging\s+in)[\s\S]{0,120}?(?:\d{1,2}\s*(?:months|years)|following\s+termination|termination\s+of\s+this\s+agreement)/i,
      explanation: "Restricts your ability to work with clients, hire talent, or earn a living in your industry for an extended duration post-termination.",
      recommendation: "Limit non-solicitation strictly to existing active accounts and reduce duration to 6 months."
    },
    {
      id: "asymmetric_termination",
      title: "Unilateral / Asymmetric Termination Rights",
      category: "Term & Termination",
      severity: "HIGH",
      scorePenalty: 20,
      regex: /(?:terminate\s+(?:this\s+agreement\s+)?at\s+any\s+time\s+with\s+(?:24|48|72)\s*hours|company\s+may\s+terminate\s+at\s+will|immediate\s+termination\s+without\s+cause)[\s\S]{0,160}?(?:contractor|tenant|employee|party)\s+may\s+terminate\s+only/i,
      explanation: "One party can terminate the agreement almost instantly while you are handcuffed by prolonged mandatory advance notice.",
      recommendation: "Demand reciprocal 30-day termination for convenience with pro-rated payout."
    },
    {
      id: "unilateral_confidentiality",
      title: "Unilateral / Asymmetric Confidentiality",
      category: "Confidentiality & Privacy",
      severity: "HIGH",
      scorePenalty: 20,
      regex: /(?:no\s+reciprocal\s+confidentiality|unilateral\s+confidentiality|receiving\s+party\s+strictly\s+agrees[\s\S]{0,120}?no\s+reciprocal|solely\s+for\s+the\s+benefit\s+of\s+(?:titan|disclosing|company))/i,
      explanation: "Only you are bound to maintain secrecy while the counterparty is free to share or commercialize your proprietary discussions.",
      recommendation: "Convert into a standard bilateral Mutual NDA with identical reciprocal duty of care."
    },
    {
      id: "perpetual_survival",
      title: "Perpetual Obligation Survival Without Expiry",
      category: "Term & Termination",
      severity: "MEDIUM",
      scorePenalty: 15,
      regex: /(?:survive\s+in\s+perpetuity|never\s+expire|perpetual\s+(?:obligations?|survival)|indefinite\s+confidentiality|survive\s+indefinitely)/i,
      explanation: "Binds you to non-disclosure or covenants forever, creating permanent indefinite liability for public information.",
      recommendation: "Cap standard confidentiality survival to 2 to 3 years post-termination, carving out only bona fide trade secrets."
    },
    {
      id: "extended_payment_terms",
      title: "Delayed Compensation / Net-60+ Payment Lock",
      category: "Financial Penalties",
      severity: "MEDIUM",
      scorePenalty: 14,
      regex: /(?:net[\s-](?:60|90|120)|payable\s+within\s+(?:60|90|120)\s*days|pay\s+when\s+paid|contingent\s+upon\s+client\s+payment)/i,
      explanation: "Forces you to act as an interest-free lender by delaying compensation up to 2-4 months following deliverable completion.",
      recommendation: "Require standard Net-15 or Net-30 payment terms with 1.5% monthly late payment interest."
    },
    {
      id: "unilateral_attorney_fees",
      title: "Asymmetric Legal Fees & Cost Shifting",
      category: "Dispute Resolution",
      severity: "HIGH",
      scorePenalty: 16,
      regex: /(?:all\s+legal\s+expenses\s+and\s+attorney'?s?\s+fees\s+incurred\s+in\s+enforcing|responsible\s+for\s+all\s+(?:attorney'?s?|legal)\s+fees|costs\s+assessed\s+against\s+(?:receiving\s+party|tenant|contractor))/i,
      explanation: "If any dispute occurs, you must pay all of their attorneys' fees, even before a court determination of guilt.",
      recommendation: "Provide that each party covers their own fees, or award fees only to the ultimate prevailing party."
    },
    {
      id: "right_of_entry_without_notice",
      title: "Unrestricted Entry & Inspection Without Notice",
      category: "Operational Duties",
      severity: "MEDIUM",
      scorePenalty: 14,
      regex: /(?:enter\s+(?:the\s+)?(?:premises|property|apartment|leased\s+premises)\s+at\s+any\s+time\s+without\s+(?:prior\s+)?notice|unrestricted\s+access\s+without\s+notice)/i,
      explanation: "Violates the right to quiet enjoyment by allowing the counterparty to enter unannounced without advance written notice.",
      recommendation: "Require at least 24 to 48 hours advance written notice, except in verifiable emergencies."
    },
    {
      id: "injunction_without_bond",
      title: "Injunction & Restraining Orders Without Bond",
      category: "Dispute Resolution",
      severity: "MEDIUM",
      scorePenalty: 12,
      regex: /(?:injunctive\s+relief\s+without\s+(?:the\s+requirement\s+of\s+)?posting\s+(?:a\s+)?bond|restraining\s+order\s+without\s+bond)/i,
      explanation: "Allows the counterparty to obtain immediate restraining orders shutting down your work without having to post security bond.",
      recommendation: "Delete the waiver so a judge determines appropriate bond requirements to protect against wrongful injunctions."
    },
    {
      id: "broad_warranty_disclaimer",
      title: "Total Disclaimer of Warranties & 'As-Is' Assumption",
      category: "Operational Duties",
      severity: "MEDIUM",
      scorePenalty: 12,
      regex: /(?:as[\s-]is(?:,\s*with\s+all\s+faults)?|disclaims?\s+all\s+(?:implied\s+)?warranties|without\s+warranty\s+of\s+any\s+kind|no\s+liability\s+for\s+temporary\s+loss\s+of\s+(?:heating|plumbing|electrical|utilities))/i,
      explanation: "Waives statutory protections of merchantability, habitability, or fitness for purpose, leaving you with zero recourse.",
      recommendation: "Retain standard express warranties of professional workmanship and essential habitability guarantees."
    },
    {
      id: "draconian_late_fees",
      title: "Compounding Daily Late Penalties",
      category: "Financial Penalties",
      severity: "MEDIUM",
      scorePenalty: 12,
      regex: /(?:late\s+fee\s+of\s+\$[\d,]+(?:\.\d{2})?\s+plus\s+\$[\d,]+(?:\.\d{2})?\s+per\s+(?:additional\s+)?day|immediate\s+late\s+fee\s+of\s+\$1[5-9]\d|\$2\d{2})/i,
      explanation: "Imposes compounding daily interest or punitive late fees that can quickly exceed statutory limits.",
      recommendation: "Negotiate a standard 5-day grace period and cap the late fee at 5% of the monthly payment."
    },
    {
      id: "sole_repair_obligation",
      title: "Unreasonable Maintenance & Repair Shift",
      category: "Operational Duties",
      severity: "MEDIUM",
      scorePenalty: 12,
      regex: /(?:tenant|contractor|borrower)\s+shall\s+be\s+solely\s+responsible\s+for\s+all\s+(?:maintenance|repairs|appliance\s+replacements)/i,
      explanation: "Shifts structural or capital expenditure burdens that are traditionally the landlord's or asset owner's responsibility.",
      recommendation: "Limit tenant responsibility to damages caused by tenant negligence or misuse, with landlord handling normal wear and tear."
    }
  ];

  /**
   * Sanitizes binary and XML artifacts if Word docx or PDF was passed as raw text
   */
  static cleanText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let cleaned = rawText;

    // Detect unextracted binary PDF
    if (cleaned.startsWith('%PDF-') || (cleaned.includes('/Filter') && cleaned.includes('/FlateDecode'))) {
      return '[ERROR: Binary PDF file detected without readable text. Please copy-paste text or upload a searchable PDF.]';
    }

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
    if (!documentText || typeof documentText !== 'string' || documentText.trim().length < 15) {
      return {
        score: 0,
        grade: 'F',
        riskLevel: 'Invalid Document',
        trapsFoundCount: 0,
        traps: [],
        clauses: [],
        obligations: [],
        actionChecklist: [],
        summary: 'No valid document text provided.'
      };
    }

    const text = this.cleanText(documentText);
    if (text.startsWith('[ERROR:')) {
      return {
        score: 0,
        grade: 'F',
        riskLevel: 'Extraction Error',
        trapsFoundCount: 1,
        traps: [{
          ruleId: 'binary_file_error',
          title: 'Unextracted Binary Document',
          category: 'Document Parsing',
          severity: 'CRITICAL',
          scorePenalty: 50,
          snippet: text.slice(0, 150),
          clauseId: null,
          clauseTitle: 'Upload Error',
          explanation: 'This file contains compressed binary data (such as an encrypted PDF or unscanned document). Plain text could not be parsed.',
          recommendation: 'Please copy and paste the contract text directly into the editor for instant analysis.'
        }],
        clauses: [],
        obligations: [],
        actionChecklist: [],
        summary: text
      };
    }

    const clauses = this.segmentClauses(text);
    const traps = this.detectTraps(text, clauses);
    const obligations = this.extractObligations(clauses);
    const actionChecklist = this.generateActionChecklist(traps, obligations);

    // Compute Safety Score (0-100): 100 = Fair & Safe, 0 = Extremely Risky
    let penaltyTotal = 0;
    traps.forEach(trap => {
      penaltyTotal += trap.scorePenalty;
    });

    let score = 100 - penaltyTotal;

    // Realistic calibration: Real legal agreements are rarely 100% risk-free.
    if (traps.length === 0) {
      const lower = text.toLowerCase();
      let minorFrictions = 0;
      if (lower.includes('sole discretion')) minorFrictions += 4;
      if (lower.includes('at customer\'s expense') || lower.includes('at tenant\'s expense') || lower.includes('at contractor\'s expense')) minorFrictions += 4;
      if (lower.includes('waive') || lower.includes('waiver')) minorFrictions += 3;
      if (lower.includes('penalty') || lower.includes('late fee')) minorFrictions += 3;
      if (lower.includes('terminate without cause') || lower.includes('immediate termination')) minorFrictions += 4;
      if (lower.includes('reimburse') || lower.includes('liable for')) minorFrictions += 3;

      if (clauses.length >= 3) {
        score = Math.max(76, Math.min(94, 94 - minorFrictions));
      } else {
        score = Math.max(82, Math.min(96, 96 - minorFrictions));
      }
    } else {
      score = Math.max(15, Math.min(88, score));
    }

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

      // 1. Notice Deadlines & Advance Cancellation Windows
      const noticeMatch = text.match(/(?:at\s+least\s+)?(\d{1,3})\s*(?:business\s*|calendar\s*)?(days?|hours?)(?:[\s\S]{0,50}?(?:written\s*)?notice|\s*prior\s*to|\s*in\s*advance|\s*before\s*expiration)/i);
      if (noticeMatch) {
        obligations.push({
          type: 'Notice Deadline',
          timeframe: `${noticeMatch[1]} Days`,
          description: `Deliver advance written notice stipulated in "${clause.title}".`,
          clauseId: clause.id,
          party: lower.includes('tenant') || lower.includes('contractor') || lower.includes('receiving') ? 'You' : 'Mutual / Counterparty'
        });
      }

      // 2. Payment Terms & Scheduled Compensation
      const payMatch = text.match(/(?:due\s+on\s+or\s+before|payable\s+within|net[- ]?|monthly\s+rent\s+of|hourly\s+rate\s+of)\s*(?:the\s+)?(\$[\d,]+(?:\.\d{2})?|\d{1,2}(?:st|nd|rd|th)?|\d{1,3}\s*days?)/i);
      if (payMatch) {
        obligations.push({
          type: 'Payment Schedule',
          timeframe: payMatch[1].includes('days') || payMatch[1].includes('Days') ? payMatch[1] : `${payMatch[1]} Monthly`,
          description: `Submit scheduled payment as stipulated in "${clause.title}".`,
          clauseId: clause.id,
          party: lower.includes('tenant') || lower.includes('contractor agrees') ? 'You' : 'Scheduled'
        });
      }

      // 3. Agreement Term Duration & Expiration Milestones
      const termMatch = text.match(/(?:remain\s+in\s+effect\s+for\s+(?:a\s+period\s+of\s+)?|term\s+of\s+this\s+lease\s+shall\s+commence[\s\S]{0,50}?end\s+on\s+)([^,\.\n]{3,40})/i);
      if (termMatch) {
        obligations.push({
          type: 'Contract Term & Expiration',
          timeframe: termMatch[1].trim(),
          description: `Active contract duration and renewal milestone under "${clause.title}".`,
          clauseId: clause.id,
          party: 'All Parties'
        });
      }

      // 4. Confidentiality & Ongoing Non-Disclosure Duty
      if (lower.includes('confidential') && (lower.includes('protect') || lower.includes('duty of care') || lower.includes('survive'))) {
        const survivalMatch = text.match(/(?:survive\s+in\s+perpetuity|survive\s+termination|period\s+of\s+([^,\.\n]{3,25}))/i);
        obligations.push({
          type: 'Confidentiality Duty of Care',
          timeframe: survivalMatch ? survivalMatch[0] : 'Ongoing Duty',
          description: `Maintain secrecy and protective duty of care for proprietary disclosures under "${clause.title}".`,
          clauseId: clause.id,
          party: lower.includes('receiving party strictly') ? 'You (Receiving Party)' : 'Mutual'
        });
      }

      // 5. Restrictive Covenants / Non-Solicitation Duration
      const solicitMatch = text.match(/(?:period\s+of\s+(\d{1,2}\s*(?:months?|years?))|for\s+a\s+period\s+of\s+(\d{1,2}\s*(?:months?|years?)))[\s\S]{0,60}?(?:solicit|do\s+business|client)/i);
      if (solicitMatch) {
        obligations.push({
          type: 'Restrictive Covenant / Non-Solicit',
          timeframe: solicitMatch[1] || solicitMatch[2] || 'Post-Termination',
          description: `Restricted from soliciting clients, employees, or vendors as defined in "${clause.title}".`,
          clauseId: clause.id,
          party: 'You'
        });
      }

      // 6. Operational Responsibilities & Deliverables
      if (lower.includes('responsible for') && (lower.includes('maintenance') || lower.includes('repairs') || lower.includes('deliverables') || lower.includes('appliance'))) {
        obligations.push({
          type: 'Operational Responsibility',
          timeframe: 'Ongoing',
          description: `Fulfill maintenance or service deliverables stipulated in "${clause.title}".`,
          clauseId: clause.id,
          party: 'You'
        });
      }

      // 7. Asset Return & Proprietary Materials
      if (lower.includes('return') && (lower.includes('confidential') || lower.includes('property') || lower.includes('materials'))) {
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
