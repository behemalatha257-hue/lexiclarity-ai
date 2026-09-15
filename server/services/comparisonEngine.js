/**
 * Side-by-Side Redline & Contract Comparison Engine
 * Clause-level diffing, semantic shift detection, and risk delta scoring.
 */

const RiskAnalyzer = require('./riskAnalyzer');

class ComparisonEngine {
  /**
   * Compares two versions of a contract (Doc A vs Doc B)
   */
  static compare(docA, docB, options = {}) {
    const analysisA = RiskAnalyzer.analyze(docA);
    const analysisB = RiskAnalyzer.analyze(docB);

    const clausesA = analysisA.clauses || [];
    const clausesB = analysisB.clauses || [];

    const changes = [];
    const matchedBIndexes = new Set();

    // 1. Compare clauses in A with corresponding clauses in B
    clausesA.forEach((clauseA, idxA) => {
      // Find best match in B using category and text overlap
      let bestMatchIdx = -1;
      let bestSimScore = 0;

      clausesB.forEach((clauseB, idxB) => {
        if (matchedBIndexes.has(idxB)) return;

        const sim = this.calculateSimilarity(clauseA.originalText, clauseB.originalText);
        if (sim > bestSimScore) {
          bestSimScore = sim;
          bestMatchIdx = idxB;
        }
      });

      if (bestMatchIdx !== -1 && bestSimScore > 0.35) {
        matchedBIndexes.add(bestMatchIdx);
        const clauseB = clausesB[bestMatchIdx];

        if (bestSimScore > 0.95) {
          changes.push({
            type: 'UNCHANGED',
            title: clauseA.title,
            category: clauseA.category,
            clauseA: clauseA.originalText,
            clauseB: clauseB.originalText,
            similarity: bestSimScore,
            riskShift: 'Neutral',
            explanation: 'Clause wording is essentially identical between both versions.'
          });
        } else {
          // Detected modification / semantic shift
          const shiftAnalysis = this.evaluateRiskShift(clauseA, clauseB);
          changes.push({
            type: 'MODIFIED',
            title: `${clauseA.title} → ${clauseB.title}`,
            category: clauseA.category,
            clauseA: clauseA.originalText,
            clauseB: clauseB.originalText,
            similarity: bestSimScore,
            diffSnippet: this.generateDiffSnippet(clauseA.originalText, clauseB.originalText),
            riskShift: shiftAnalysis.shift,
            explanation: shiftAnalysis.explanation
          });
        }
      } else {
        // Clause was removed in Doc B
        changes.push({
          type: 'REMOVED',
          title: clauseA.title,
          category: clauseA.category,
          clauseA: clauseA.originalText,
          clauseB: null,
          similarity: 0,
          riskShift: 'Warning',
          explanation: `This clause exists in Document A but was completely deleted in Document B.`
        });
      }
    });

    // 2. Identify newly added clauses in Doc B
    clausesB.forEach((clauseB, idxB) => {
      if (!matchedBIndexes.has(idxB)) {
        changes.push({
          type: 'ADDED',
          title: clauseB.title,
          category: clauseB.category,
          clauseA: null,
          clauseB: clauseB.originalText,
          similarity: 0,
          riskShift: clauseB.category === 'Liability & Indemnity' || clauseB.category === 'Financial & Payments' ? 'High Risk' : 'Review Needed',
          explanation: `New clause introduced in Document B not present in original Document A.`
        });
      }
    });

    // 3. Compute Delta Score
    const scoreDiff = analysisB.score - analysisA.score;
    let verdict = 'Doc B is virtually equivalent to Doc A.';
    if (scoreDiff > 5) {
      verdict = `Document B is safer and more favorable (+${scoreDiff} pts safety increase).`;
    } else if (scoreDiff < -5) {
      verdict = `Document B is significantly riskier and more restrictive (${scoreDiff} pts safety decrease).`;
    }

    return {
      docASummary: {
        score: analysisA.score,
        grade: analysisA.grade,
        riskLevel: analysisA.riskLevel,
        clauseCount: clausesA.length,
        trapsCount: analysisA.trapsFoundCount
      },
      docBSummary: {
        score: analysisB.score,
        grade: analysisB.grade,
        riskLevel: analysisB.riskLevel,
        clauseCount: clausesB.length,
        trapsCount: analysisB.trapsFoundCount
      },
      scoreDelta: scoreDiff,
      verdict,
      changesCount: {
        total: changes.length,
        modified: changes.filter(c => c.type === 'MODIFIED').length,
        added: changes.filter(c => c.type === 'ADDED').length,
        removed: changes.filter(c => c.type === 'REMOVED').length,
        unchanged: changes.filter(c => c.type === 'UNCHANGED').length
      },
      changes,
      comparedAt: new Date().toISOString()
    };
  }

  /**
   * Word-level token similarity Jaccard index
   */
  static calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const words1 = new Set(str1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(str2.toLowerCase().match(/\b\w+\b/g) || []);

    if (words1.size === 0 || words2.size === 0) return 0;

    let intersection = 0;
    for (const w of words1) {
      if (words2.has(w)) intersection++;
    }

    const union = new Set([...words1, ...words2]).size;
    return union > 0 ? (intersection / union) : 0;
  }

  /**
   * Evaluates if changes between clauses increased or decreased risk
   */
  static evaluateRiskShift(clauseA, clauseB) {
    const textA = clauseA.originalText.toLowerCase();
    const textB = clauseB.originalText.toLowerCase();

    // Check indemnification shift
    if (textA.includes('mutual') && !textB.includes('mutual') && textB.includes('indemnif')) {
      return {
        shift: 'CRITICAL HAZARD',
        explanation: 'Shifted from mutual indemnification to unilateral indemnification favoring the counterparty.'
      };
    }

    // Check notice window shift
    const noticeA = textA.match(/(\d+)\s*days/);
    const noticeB = textB.match(/(\d+)\s*days/);
    if (noticeA && noticeB) {
      const daysA = parseInt(noticeA[1], 10);
      const daysB = parseInt(noticeB[1], 10);
      if (daysB < daysA) {
        return {
          shift: 'Warning',
          explanation: `Notice period reduced from ${daysA} days to ${daysB} days.`
        };
      }
    }

    // Check liability cap additions
    if (!textA.includes('limitation of liability') && textB.includes('limitation of liability')) {
      return {
        shift: 'Favorable',
        explanation: 'Added liability limitation capping total financial damages.'
      };
    }

    return {
      shift: 'Moderate Adjustment',
      explanation: 'Language modified; verify obligations and terms align with intent.'
    };
  }

  /**
   * Simple textual word diff generator
   */
  static generateDiffSnippet(textA, textB) {
    const wordsA = textA.split(/\s+/);
    const wordsB = textB.split(/\s+/);
    
    // Quick diff tokens
    return {
      wordCountBefore: wordsA.length,
      wordCountAfter: wordsB.length,
      deltaWords: wordsB.length - wordsA.length
    };
  }
}

module.exports = ComparisonEngine;
