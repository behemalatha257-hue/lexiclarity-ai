/**
 * LexiClarity AI - Server Entry Point
 * Production-ready Express API with security headers, rate limiting, and AI legal routing.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const PiiSanitizer = require('./server/services/piiSanitizer');
const RiskAnalyzer = require('./server/services/riskAnalyzer');
const ComparisonEngine = require('./server/services/comparisonEngine');
const ScenarioSimulator = require('./server/services/scenarioSimulator');
const AttorneyPacketGenerator = require('./server/services/attorneyPacketGenerator');
const GeminiService = require('./server/services/geminiService');
const { LegalDictionaryService } = require('./server/services/legalDictionary');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for flexible client-side asset & TTS integration
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Serve Static Frontend
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

/**
 * 1. PII Sanitization & LexiGuard Anonymizer
 */
app.post('/api/sanitize', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for sanitization' });
    }
    const result = PiiSanitizer.sanitize(text);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Sanitization error:', err);
    return res.status(500).json({ error: 'Sanitization processing failed', details: err.message });
  }
});

/**
 * 2. ClauseRadar Risk & Document Analyzer
 */
app.post('/api/analyze', (req, res) => {
  try {
    const { text, autoSanitize = false } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    let processedText = text;
    let piiReport = null;

    if (autoSanitize) {
      piiReport = PiiSanitizer.sanitize(text);
      processedText = piiReport.sanitizedText;
    }

    const analysis = RiskAnalyzer.analyze(processedText);
    return res.json({
      success: true,
      data: {
        ...analysis,
        piiReport
      }
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return res.status(500).json({ error: 'Document analysis failed', details: err.message });
  }
});

/**
 * 3. Side-by-Side Redline Contract Comparison
 */
app.post('/api/compare', (req, res) => {
  try {
    const { docA, docB } = req.body;
    if (!docA || !docB) {
      return res.status(400).json({ error: 'Both docA and docB texts are required for comparison' });
    }

    const comparison = ComparisonEngine.compare(docA, docB);
    return res.json({ success: true, data: comparison });
  } catch (err) {
    console.error('Comparison error:', err);
    return res.status(500).json({ error: 'Contract comparison failed', details: err.message });
  }
});

/**
 * 4. Grounded AI Legal Assistant Chat
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { question, documentText, apiKey } = req.body;
    if (!question || !documentText) {
      return res.status(400).json({ error: 'Question and documentText are required' });
    }

    const result = await GeminiService.answerQuery(question, documentText, apiKey);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat processing failed', details: err.message });
  }
});

/**
 * 5. What-If Scenario Legal Outcome Simulator
 */
app.post('/api/simulate', (req, res) => {
  try {
    const { prompt, documentText } = req.body;
    if (!prompt || !documentText) {
      return res.status(400).json({ error: 'Prompt and documentText are required' });
    }

    const simulation = ScenarioSimulator.simulate(prompt, documentText);
    return res.json({ success: true, data: simulation });
  } catch (err) {
    console.error('Simulation error:', err);
    return res.status(500).json({ error: 'Scenario simulation failed', details: err.message });
  }
});

/**
 * 6. Attorney Consultation Packet Generator
 */
app.post('/api/attorney-packet', (req, res) => {
  try {
    const { documentText, clientName, docTitle, goal } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    const packet = AttorneyPacketGenerator.generatePacket(documentText, {
      clientName,
      docTitle,
      goal
    });

    return res.json({ success: true, data: packet });
  } catch (err) {
    console.error('Attorney packet error:', err);
    return res.status(500).json({ error: 'Failed to generate attorney packet', details: err.message });
  }
});

/**
 * 7. AI Redline Suggestion
 */
app.post('/api/redline', async (req, res) => {
  try {
    const { clauseText, objective, apiKey } = req.body;
    if (!clauseText) {
      return res.status(400).json({ error: 'Clause text is required' });
    }

    const result = await GeminiService.suggestRedline(clauseText, objective, apiKey);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Redline suggestion error:', err);
    return res.status(500).json({ error: 'Redline generation failed', details: err.message });
  }
});

/**
 * 8. Legal Dictionary & Glossary Search
 */
app.get('/api/dictionary', (req, res) => {
  try {
    const { query } = req.query;
    const results = LegalDictionaryService.search(query);
    return res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error('Dictionary error:', err);
    return res.status(500).json({ error: 'Dictionary search failed', details: err.message });
  }
});

/**
 * 9. Health & Diagnostic Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'LexiClarity AI',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
    version: '1.0.0'
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server if directly run from node
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 LexiClarity AI Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
