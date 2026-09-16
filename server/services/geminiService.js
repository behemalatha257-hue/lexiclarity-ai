/**
 * Google Gemini Generative AI Service
 * Powered by Google Generative AI SDK with structured prompting, citation grounding, and intelligent offline fallback.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const RiskAnalyzer = require('./riskAnalyzer');

class GeminiService {
  /**
   * Initializes Gemini model client with provided key or env key
   */
  static getModel(apiKey) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return null;
    try {
      const genAI = new GoogleGenerativeAI(key);
      return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (e) {
      console.warn('Gemini client initialization warning:', e.message);
      return null;
    }
  }

  /**
   * Grounded Document Q&A with source clause citations
   */
  static async answerQuery(question, documentText, apiKey = null) {
    if (!question || !documentText) {
      throw new Error('Question and documentText are required');
    }

    const model = this.getModel(apiKey);
    const analysis = RiskAnalyzer.analyze(documentText);

    if (model) {
      try {
        const prompt = `You are LexiClarity AI, an expert, objective legal document navigator and assistant.
Your purpose is to help the user understand and navigate their legal agreement clearly and safely.
IMPORTANT: You provide educational and navigation assistance, not binding legal counsel.

DOCUMENT CONTEXT:
"""
${documentText.slice(0, 15000)}
"""

USER QUESTION:
"${question}"

INSTRUCTIONS:
1. Provide a direct, plain-English, easy-to-understand answer.
2. Quote and cite the EXACT clause or section number that supports your answer (e.g. [Clause 3: Termination]).
3. Point out any risks, traps, or missing protections related to this topic.
4. Suggest a concrete next step or question for their attorney if appropriate.
5. Format your response cleanly using Markdown with bullet points and bold highlights.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return {
          answer: responseText,
          provider: 'Google Gemini 2.5 Flash',
          citations: this.extractCitations(responseText, analysis.clauses),
          timestamp: new Date().toISOString()
        };
      } catch (err) {
        console.warn('Gemini API call failed, falling back to built-in reasoning engine:', err.message);
      }
    }

    // Built-in intelligent fallback engine
    return this.fallbackAnswerQuery(question, documentText, analysis);
  }

  /**
   * Explain a clause in plain English and optionally in a target language
   */
  static async explainClause(clauseText, language = 'English', apiKey = null) {
    const model = this.getModel(apiKey);

    if (model) {
      try {
        const prompt = `Explain the following legal clause in simple, plain ${language} so a non-lawyer can understand it immediately.
Include:
1. What this means in plain words
2. Who benefits most (You or the Counterparty)
3. Hidden risks or gotchas to watch for
4. Suggested negotiation tip

Clause:
"""
${clauseText}
"""`;

        const result = await model.generateContent(prompt);
        return {
          explanation: result.response.text(),
          language,
          provider: 'Google Gemini 2.5 Flash'
        };
      } catch (err) {
        console.warn('Gemini explainClause failed, falling back:', err.message);
      }
    }

    // Fallback explanation
    return {
      explanation: `**Plain-English Summary (${language}):**\nThis clause establishes operational responsibilities and legal obligations between the signing parties. Ensure timelines, monetary amounts, and notice requirements match your verbal agreement.`,
      language,
      provider: 'LexiClarity Legal Engine'
    };
  }

  /**
   * Generates a balanced counter-proposal redline
   */
  static async suggestRedline(clauseText, objective, apiKey = null) {
    const model = this.getModel(apiKey);

    if (model) {
      try {
        const prompt = `You are a contract negotiation assistant. Rewrite the following clause to make it balanced, fair, and protective of the signer while remaining professionally acceptable to the counterparty.
Objective: ${objective || 'Make mutual, cap liability, and add reasonable notice period'}

Original Clause:
"""
${clauseText}
"""

Provide:
1. Proposed Redline Replacement (exact wording ready to paste into counter-proposal)
2. Summary of Changes Made
3. Negotiation Rationale to email the counterparty`;

        const result = await model.generateContent(prompt);
        return {
          redlineText: result.response.text(),
          provider: 'Google Gemini 2.5 Flash'
        };
      } catch (err) {
        console.warn('Gemini suggestRedline fallback:', err.message);
      }
    }

    return {
      redlineText: `### Proposed Balanced Amendment:\n"Each party agrees to indemnify, defend, and hold harmless the other party strictly for direct damages resulting from gross negligence or willful misconduct, capped at the total amount paid in the preceding 12 months."\n\n**Rationale:** Replaces one-sided indemnification with standard mutual protection and an industry-standard financial cap.`,
      provider: 'LexiClarity Legal Engine'
    };
  }

  /**
   * Internal intelligent legal reasoning engine
   */
  static fallbackAnswerQuery(question, documentText, analysis) {
    const q = question.toLowerCase();
    const clauses = analysis.clauses || [];
    const traps = analysis.traps || [];

    // 1. Check for specific clause inquiry (e.g. "Clause 1", "Clause 2", "Section 3")
    const clauseNumMatch = q.match(/(?:clause|section|article)\s*(\d+)/i);
    if (clauseNumMatch) {
      const num = parseInt(clauseNumMatch[1], 10);
      const targetClause = clauses.find(c => c.clauseNumber === num);
      if (targetClause) {
        return {
          answer: `### Analysis of Clause ${targetClause.clauseNumber}: ${targetClause.title}\n\n**1. Plain-English Explanation:**\n${targetClause.summary}\n\n**2. Key Risk & Implications:**\n${targetClause.category === 'Liability & Indemnity' ? 'This clause imposes legal and financial liability. Verify if protections are strictly mutual.' : targetClause.category === 'Term & Exit Rights' ? 'Governs your cancellation and notice obligations. Missing a deadline can trigger automated renewal.' : 'Standard operational terms. Ensure all dates and amounts match your verbal agreement.'}\n\n**3. Original Clause Extract:**\n> "${targetClause.originalText}"`,
          provider: 'LexiClarity Legal Intelligence Engine',
          citations: [{
            clauseId: targetClause.id,
            title: targetClause.title,
            category: targetClause.category,
            snippet: targetClause.originalText.slice(0, 160) + '...'
          }],
          timestamp: new Date().toISOString()
        };
      }
    }

    // 2. Identify relevant clause based on topic keywords
    let matchedClause = clauses.find(c => {
      const cText = c.originalText.toLowerCase();
      if (q.includes('terminat') || q.includes('cancel') || q.includes('leave') || q.includes('break') || q.includes('renew')) return c.category === 'Term & Exit Rights' || cText.includes('terminat');
      if (q.includes('pay') || q.includes('rent') || q.includes('fee') || q.includes('cost') || q.includes('due')) return c.category === 'Financial & Payments';
      if (q.includes('deposit') || q.includes('refund') || q.includes('security')) return cText.includes('deposit');
      if (q.includes('sue') || q.includes('arbitrat') || q.includes('court') || q.includes('jury') || q.includes('dispute')) return c.category === 'Dispute Resolution';
      if (q.includes('liab') || q.includes('indemn') || q.includes('damage') || q.includes('hold harmless')) return c.category === 'Liability & Indemnity';
      if (q.includes('ip') || q.includes('intellectual') || q.includes('invention') || q.includes('copyright') || q.includes('work for hire')) return c.category === 'Intellectual Property';
      if (q.includes('repair') || q.includes('maintenance') || q.includes('habitability') || q.includes('appliance')) return c.category === 'Operational Duties';
      return false;
    }) || clauses[0];

    let answer = `### Document Navigation & Legal Insight\n\n`;

    if (q.includes('risk') || q.includes('trap') || q.includes('score') || q.includes('safe') || q.includes('fair')) {
      answer += `**1. Executive Risk Assessment:**\nThis document has a calculated **Safety Score of ${analysis.score}/100 (Grade ${analysis.grade})** with **${analysis.trapsFoundCount} high-risk trap(s)** identified.\n\n`;
      if (traps.length > 0) {
        answer += `**2. Flagged Red Flags:**\n${traps.map((t, idx) => `• **${t.title}** (${t.severity} Risk): ${t.explanation}`).join('\n')}\n\n`;
      }
      answer += `**3. Recommended Next Step:** Review the Pre-Signing Checklist before signing and request the proposed redline counter-proposals.`;
    } else if (q.includes('terminat') || q.includes('cancel') || q.includes('leave') || q.includes('exit')) {
      answer += `**1. Termination & Notice Requirements:**\nUnder **${matchedClause ? matchedClause.title : 'Termination Provisions'}**, ending the agreement requires formal written notification delivered within the designated notice window (typically 30–60 days prior).\n\n**2. Key Risk:** Check whether auto-renewal or liquidated termination damages are stipulated. Early departure without cause may trigger forfeiture of deposits.\n\n**3. Recommended Action:** Send termination notices via certified postal mail or registered email and request written receipt acknowledgement.`;
    } else if (q.includes('pay') || q.includes('rent') || q.includes('fee') || q.includes('late')) {
      answer += `**1. Payment Schedule & Grace Periods:**\nAccording to **${matchedClause ? matchedClause.title : 'Payment Terms'}**, payments are scheduled as stipulated in the agreement. Late payments after the grace period incur recurring penalty fees.\n\n**2. Practical Protection:** Always retain bank transfer receipts and obtain written confirmation of all fee waivers.`;
    } else if (q.includes('deposit') || q.includes('refund')) {
      answer += `**1. Deposit Holding & Deductions:**\nSecurity deposits are held against physical damages or unpaid arrears. By law and standard contract practice, any deductions must be itemized with receipts.\n\n**2. Action Item:** Conduct a joint move-in and move-out walkthrough with dated photographs to prevent improper deductions.`;
    } else if (q.includes('arbitrat') || q.includes('court') || q.includes('sue') || q.includes('dispute')) {
      answer += `**1. Dispute Resolution Jurisdiction:**\nUnder **${matchedClause ? matchedClause.title : 'Dispute Resolution Clause'}**, disputes may be subject to mandatory binding private arbitration, waiving public jury trial and class action rights.\n\n**2. Negotiation Tip:** Request standard local court jurisdiction or require the counterparty to bear all arbitration filing fees.`;
    } else {
      answer += `**1. Plain-English Analysis:**\nYour inquiry pertains to **${matchedClause ? matchedClause.title : 'Agreement Terms'}** (${matchedClause ? matchedClause.category : 'General'}).\n\n**2. Summary of Terms:**\n${matchedClause ? matchedClause.summary : 'The agreement sets forth binding mutual duties, notice requirements, and remedies.'}\n\n**3. Key Advice:** Ensure that verbal assurances from sales reps or landlords are explicitly included in the written text before signing.`;
    }

    const citations = matchedClause ? [{
      clauseId: matchedClause.id,
      title: matchedClause.title,
      category: matchedClause.category,
      snippet: matchedClause.originalText.slice(0, 160) + '...'
    }] : [];

    return {
      answer,
      provider: 'LexiClarity Legal Intelligence Engine',
      citations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper to extract citations from text
   */
  static extractCitations(responseText, clauses) {
    const citations = [];
    clauses.forEach(c => {
      if (responseText.toLowerCase().includes(c.title.toLowerCase()) || responseText.includes(c.id)) {
        citations.push({
          clauseId: c.id,
          title: c.title,
          category: c.category,
          snippet: c.originalText.slice(0, 160) + '...'
        });
      }
    });
    return citations.slice(0, 3);
  }
}

module.exports = GeminiService;
