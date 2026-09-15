const ComparisonEngine = require('../server/services/comparisonEngine');
const SAMPLE_DOCUMENTS = require('../public/js/sampleData');

describe('Side-by-Side Comparison Engine', () => {
  test('should compare Standard NDA vs Vendor NDA and detect risk shifts', () => {
    const docA = SAMPLE_DOCUMENTS.ndaStandard.text;
    const docB = SAMPLE_DOCUMENTS.ndaVendor.text;

    const result = ComparisonEngine.compare(docA, docB);

    expect(result.docASummary).toBeDefined();
    expect(result.docBSummary).toBeDefined();
    expect(result.scoreDelta).toBeLessThan(0); // Doc B is riskier
    expect(result.changes.length).toBeGreaterThan(0);

    // Verify change classifications
    const types = result.changes.map(c => c.type);
    expect(types.some(t => t === 'MODIFIED' || t === 'ADDED' || t === 'REMOVED')).toBe(true);
  });

  test('should identify identical contracts as unchanged', () => {
    const doc = SAMPLE_DOCUMENTS.ndaStandard.text;
    const result = ComparisonEngine.compare(doc, doc);

    expect(result.scoreDelta).toBe(0);
    expect(result.changesCount.added).toBe(0);
    expect(result.changesCount.removed).toBe(0);
  });
});
