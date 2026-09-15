/**
 * LexiClarity AI - High-Speed Automated Test Runner
 * Executes unit, integration, and security test suites with detailed reporting.
 */

const assert = require('assert');
const PiiSanitizer = require('./server/services/piiSanitizer');
const RiskAnalyzer = require('./server/services/riskAnalyzer');
const ComparisonEngine = require('./server/services/comparisonEngine');
const ScenarioSimulator = require('./server/services/scenarioSimulator');
const AttorneyPacketGenerator = require('./server/services/attorneyPacketGenerator');
const { LegalDictionaryService } = require('./server/services/legalDictionary');
const SAMPLE_DOCUMENTS = require('./public/js/sampleData');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('⚖️  LexiClarity AI — Automated Test Suite Execution');
  console.log('======================================================\n');

  console.log('🛡️  Suite 1: LexiGuard Privacy & PII Sanitizer');
  runTest('Redacts SSNs, Emails, Phone Numbers, and Addresses', () => {
    const raw = "Tenant John Doe, SSN: 123-45-6789, Phone: (555) 234-5678, Email: john@example.com, Address: 742 Evergreen Terrace, Springfield, OR";
    const res = PiiSanitizer.sanitize(raw);
    assert(res.piiDetectedCount >= 3, `Expected >= 3 detected PII entities, got ${res.piiDetectedCount}`);
    assert(!res.sanitizedText.includes('123-45-6789'), 'Raw SSN should not be in sanitized text');
    assert(!res.sanitizedText.includes('john@example.com'), 'Raw email should not be in sanitized text');
    assert(!res.sanitizedText.includes('(555) 234-5678'), 'Raw phone should not be in sanitized text');
    assert(res.sanitizedText.includes('[REDACTED_SSN_'), 'Should contain redacted SSN token');
    assert(res.privacyScore < 100, 'Raw exposure should lower privacy score');
  });

  runTest('Marks clean document with 100% privacy score', () => {
    const clean = "Standard mutual agreement starting October 1, 2025. All terms apply.";
    const res = PiiSanitizer.sanitize(clean);
    assert.strictEqual(res.piiDetectedCount, 0);
    assert.strictEqual(res.isClean, true);
    assert.strictEqual(res.privacyScore, 100);
  });

  runTest('Handles empty or null text safely without crashing', () => {
    const resNull = PiiSanitizer.sanitize(null);
    assert.strictEqual(resNull.sanitizedText, '');
    assert.strictEqual(resNull.piiDetectedCount, 0);
  });

  console.log('\n📊 Suite 2: ClauseRadar Risk & Trap Analyzer');
  runTest('Detects predatory traps in residential lease agreement', () => {
    const lease = SAMPLE_DOCUMENTS.lease.text;
    const analysis = RiskAnalyzer.analyze(lease);
    assert(analysis.score < 60, `Expected score < 60 for predatory lease, got ${analysis.score}`);
    assert(analysis.trapsFoundCount >= 3, `Expected >= 3 traps, got ${analysis.trapsFoundCount}`);

    const trapIds = analysis.traps.map(t => t.ruleId);
    assert(trapIds.includes('unilateral_indemnity'), 'Must detect unilateral indemnity');
    assert(trapIds.includes('mandatory_arbitration_waiver'), 'Must detect mandatory arbitration waiver');
    assert(trapIds.includes('stealth_auto_renewal'), 'Must detect auto-renewal trap');
    assert(trapIds.includes('liquidated_damages_penalty'), 'Must detect liquidated damages');
  });

  runTest('Scores balanced mutual NDA significantly higher than aggressive vendor NDA', () => {
    const std = RiskAnalyzer.analyze(SAMPLE_DOCUMENTS.ndaStandard.text);
    const vendor = RiskAnalyzer.analyze(SAMPLE_DOCUMENTS.ndaVendor.text);
    assert(std.score > vendor.score, `Standard NDA score (${std.score}) should exceed Vendor NDA (${vendor.score})`);
    assert(vendor.trapsFoundCount > std.trapsFoundCount, 'Vendor NDA should have more traps');
  });

  runTest('Segments clauses and produces plain-English summaries', () => {
    const analysis = RiskAnalyzer.analyze(SAMPLE_DOCUMENTS.lease.text);
    assert(analysis.clauses.length >= 4, `Expected >= 4 clauses, got ${analysis.clauses.length}`);
    analysis.clauses.forEach(c => {
      assert(c.id, 'Clause must have ID');
      assert(c.title, 'Clause must have Title');
      assert(c.category, 'Clause must have Category');
      assert(c.summary, 'Clause must have Summary');
    });
  });

  runTest('Extracts obligations and pre-signing action checklist', () => {
    const analysis = RiskAnalyzer.analyze(SAMPLE_DOCUMENTS.lease.text);
    assert(analysis.obligations.length > 0, 'Must extract obligations');
    assert(analysis.actionChecklist.length > 0, 'Must generate pre-signing checklist');
  });

  console.log('\n⚖️  Suite 3: Side-by-Side Redline & Contract Comparison');
  runTest('Compares Standard NDA vs Vendor NDA and calculates risk shift', () => {
    const docA = SAMPLE_DOCUMENTS.ndaStandard.text;
    const docB = SAMPLE_DOCUMENTS.ndaVendor.text;
    const comp = ComparisonEngine.compare(docA, docB);

    assert(comp.docASummary, 'Must have Doc A summary');
    assert(comp.docBSummary, 'Must have Doc B summary');
    assert(comp.scoreDelta < 0, `Expected negative score delta for vendor NDA, got ${comp.scoreDelta}`);
    assert(comp.changes.length > 0, 'Must identify clause changes');
  });

  runTest('Identifies identical contracts with 0 delta and 0 additions/removals', () => {
    const doc = SAMPLE_DOCUMENTS.ndaStandard.text;
    const comp = ComparisonEngine.compare(doc, doc);
    assert.strictEqual(comp.scoreDelta, 0);
    assert.strictEqual(comp.changesCount.added, 0);
    assert.strictEqual(comp.changesCount.removed, 0);
  });

  console.log('\n🔮 Suite 4: What-If Legal Scenario Simulator');
  runTest('Simulates early lease exit scenario and forecasts penalties', () => {
    const doc = SAMPLE_DOCUMENTS.lease.text;
    const sim = ScenarioSimulator.simulate('What happens if I terminate 3 months early?', doc);
    assert.strictEqual(sim.success, true);
    assert(sim.riskLevel.includes('High'), 'Early termination with liquidated damages should be High Risk');
    assert(sim.requiredActions.length > 0, 'Must prescribe protective actions');
    assert(sim.relevantClauses.length > 0, 'Must reference relevant clauses');
  });

  runTest('Simulates delayed payment scenario and identifies late fee rules', () => {
    const doc = SAMPLE_DOCUMENTS.lease.text;
    const sim = ScenarioSimulator.simulate('What if my payment is delayed 15 days?', doc);
    assert.strictEqual(sim.success, true);
    assert(sim.potentialPenalties.toLowerCase().includes('late'), 'Should identify late penalties');
  });

  console.log('\n💼 Suite 5: Attorney Consultation Briefing Packet Generator');
  runTest('Builds structured briefing packet with targeted questions for counsel', () => {
    const doc = SAMPLE_DOCUMENTS.lease.text;
    const packet = AttorneyPacketGenerator.generatePacket(doc, {
      clientName: 'Alex Morgan',
      docTitle: 'Residential Lease Agreement',
      goal: 'Pre-execution risk mitigation'
    });

    assert.strictEqual(packet.clientName, 'Alex Morgan');
    assert(packet.questionsForCounsel.length > 0, 'Must include questions for counsel');
    assert(packet.markdownContent.includes('# Legal Consultation Briefing Packet'), 'Must generate markdown');
    assert(packet.privacyStatus.piiDetected > 0, 'Must report sanitized PII');
  });

  console.log('\n📖 Suite 6: Legal Dictionary & Glossary');
  runTest('Searches legal terms and returns plain-English translations with negotiation tips', () => {
    const results = LegalDictionaryService.search('indemnification');
    assert(results.length > 0, 'Should find indemnification');
    assert.strictEqual(results[0].term, 'Indemnification');
    assert(results[0].plainMeaning.length > 20, 'Should have rich plain-English meaning');
    assert(results[0].tip.length > 10, 'Should have practical tip');
  });

  console.log('\n======================================================');
  console.log(`Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

main();
