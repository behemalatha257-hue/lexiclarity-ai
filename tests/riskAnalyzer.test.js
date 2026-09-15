const RiskAnalyzer = require('../server/services/riskAnalyzer');
const SAMPLE_DOCUMENTS = require('../public/js/sampleData');

describe('ClauseRadar Risk & Trap Analyzer', () => {
  test('should detect high-risk traps in predatory lease agreement', () => {
    const text = SAMPLE_DOCUMENTS.lease.text;
    const analysis = RiskAnalyzer.analyze(text);

    expect(analysis.score).toBeLessThan(60);
    expect(analysis.grade).toMatch(/[DF]/);
    expect(analysis.trapsFoundCount).toBeGreaterThanOrEqual(3);
    
    // Check specific traps
    const trapIds = analysis.traps.map(t => t.ruleId);
    expect(trapIds).toContain('unilateral_indemnity');
    expect(trapIds).toContain('mandatory_arbitration_waiver');
    expect(trapIds).toContain('stealth_auto_renewal');
    expect(trapIds).toContain('liquidated_damages_penalty');
  });

  test('should score balanced mutual NDA higher than aggressive vendor version', () => {
    const analysisStandard = RiskAnalyzer.analyze(SAMPLE_DOCUMENTS.ndaStandard.text);
    const analysisVendor = RiskAnalyzer.analyze(SAMPLE_DOCUMENTS.ndaVendor.text);

    expect(analysisStandard.score).toBeGreaterThan(analysisVendor.score);
    expect(analysisVendor.trapsFoundCount).toBeGreaterThan(analysisStandard.trapsFoundCount);
  });

  test('should segment clauses and extract plain-English summaries', () => {
    const text = SAMPLE_DOCUMENTS.lease.text;
    const analysis = RiskAnalyzer.analyze(text);

    expect(analysis.clauses.length).toBeGreaterThan(3);
    analysis.clauses.forEach(clause => {
      expect(clause.id).toBeDefined();
      expect(clause.title).toBeDefined();
      expect(clause.category).toBeDefined();
      expect(clause.summary).toBeDefined();
    });
  });

  test('should extract actionable obligations with timeframes', () => {
    const text = SAMPLE_DOCUMENTS.lease.text;
    const analysis = RiskAnalyzer.analyze(text);

    expect(analysis.obligations.length).toBeGreaterThan(0);
    const noticeObl = analysis.obligations.find(o => o.type === 'Notice Deadline');
    expect(noticeObl).toBeDefined();
    expect(noticeObl.timeframe).toContain('Days');
  });

  test('should generate pre-signing action checklist', () => {
    const text = SAMPLE_DOCUMENTS.lease.text;
    const analysis = RiskAnalyzer.analyze(text);

    expect(analysis.actionChecklist.length).toBeGreaterThan(0);
    expect(analysis.actionChecklist[0].action).toBeDefined();
    expect(analysis.actionChecklist[0].status).toBe('pending');
  });
});
