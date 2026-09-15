const request = require('supertest');
const app = require('../server');
const SAMPLE_DOCUMENTS = require('../public/js/sampleData');

describe('LexiClarity Express API Endpoints', () => {
  test('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.platform).toBe('LexiClarity AI');
  });

  test('POST /api/sanitize redacts PII', async () => {
    const res = await request(app)
      .post('/api/sanitize')
      .send({ text: "Tenant: John Doe, SSN: 111-22-3333" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sanitizedText).toContain('[REDACTED_SSN_');
  });

  test('POST /api/analyze performs risk and trap evaluation', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ text: SAMPLE_DOCUMENTS.lease.text, autoSanitize: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBeDefined();
    expect(res.body.data.traps).toBeDefined();
    expect(res.body.data.clauses).toBeDefined();
  });

  test('POST /api/compare returns side-by-side redline diff', async () => {
    const res = await request(app)
      .post('/api/compare')
      .send({
        docA: SAMPLE_DOCUMENTS.ndaStandard.text,
        docB: SAMPLE_DOCUMENTS.ndaVendor.text
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.changes).toBeDefined();
    expect(res.body.data.scoreDelta).toBeDefined();
  });

  test('POST /api/chat answers legal questions with citations', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        question: "What are the rules regarding lease cancellation and notice?",
        documentText: SAMPLE_DOCUMENTS.lease.text
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
    expect(res.body.data.citations).toBeDefined();
  });

  test('POST /api/simulate returns what-if legal outcome', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({
        prompt: "What if I terminate early?",
        documentText: SAMPLE_DOCUMENTS.lease.text
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.outcomeSummary).toBeDefined();
  });

  test('POST /api/attorney-packet returns formatted consultation briefing', async () => {
    const res = await request(app)
      .post('/api/attorney-packet')
      .send({
        documentText: SAMPLE_DOCUMENTS.lease.text,
        clientName: "Alex Morgan",
        docTitle: "Lease Agreement",
        goal: "Review termination clauses"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.questionsForCounsel).toBeDefined();
    expect(res.body.data.markdownContent).toBeDefined();
  });

  test('GET /api/dictionary returns legal glossary terms', async () => {
    const res = await request(app).get('/api/dictionary?query=indemnification');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].term).toBe('Indemnification');
  });
});
