const ScenarioSimulator = require('../server/services/scenarioSimulator');
const AttorneyPacketGenerator = require('../server/services/attorneyPacketGenerator');
const SAMPLE_DOCUMENTS = require('../public/js/sampleData');

describe('Scenario Simulator & Attorney Packet Generator', () => {
  test('should simulate early lease termination scenario accurately', () => {
    const doc = SAMPLE_DOCUMENTS.lease.text;
    const prompt = "What happens if I terminate 3 months early?";

    const result = ScenarioSimulator.simulate(prompt, doc);
    expect(result.success).toBe(true);
    expect(result.riskLevel).toContain('High');
    expect(result.requiredActions.length).toBeGreaterThan(0);
    expect(result.relevantClauses.length).toBeGreaterThan(0);
  });

  test('should compile comprehensive Attorney Consultation Packet with questions', () => {
    const doc = SAMPLE_DOCUMENTS.lease.text;
    const packet = AttorneyPacketGenerator.generatePacket(doc, {
      clientName: "Jane Doe",
      docTitle: "Residential Lease Agreement",
      goal: "Negotiate mutual indemnity and delete liquidated damages"
    });

    expect(packet.title).toContain('Attorney Briefing');
    expect(packet.clientName).toBe('Jane Doe');
    expect(packet.questionsForCounsel.length).toBeGreaterThan(0);
    expect(packet.markdownContent).toContain('# Legal Consultation Briefing Packet');
    expect(packet.privacyStatus.piiDetected).toBeGreaterThan(0);
  });
});
