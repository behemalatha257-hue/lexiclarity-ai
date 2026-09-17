/**
 * LexiClarity AI - Main Application Coordinator
 * State management, tab routing, file ingestion, PII monitoring, and settings.
 */

class LexiClarityApp {
  constructor() {
    this.activeDocument = '';
    this.currentTab = 'analyzerTab';
    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindDocumentInput();
    this.bindSampleSelector();
    this.bindSettingsModal();
    this.loadInitialSample();

    // Initialize sub-controllers
    if (window.ContractComparatorUI) window.ContractComparatorUI.init();
    if (window.LegalChatUI) window.LegalChatUI.init();
    if (window.ScenarioSimulatorUI) window.ScenarioSimulatorUI.init();
    if (window.ObligationTimelineUI) window.ObligationTimelineUI.init();
    if (window.AttorneyPacketUI) window.AttorneyPacketUI.init();
    if (window.LegalDictionaryUI) window.LegalDictionaryUI.init();
  }

  bindNavigation() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update active tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
      btn.setAttribute('aria-selected', btn.dataset.tab === tabId);
    });

    // Update visible view sections
    document.querySelectorAll('.app-view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === tabId);
    });

    // Auto refresh dependent tabs
    if (tabId === 'timelineTab' && window.ObligationTimelineUI) {
      // If analysis exists, render it. Otherwise run analysis first then render.
      if (window.DocumentAnalyzerUI && window.DocumentAnalyzerUI.currentAnalysis) {
        window.ObligationTimelineUI.renderFromActiveDoc();
      } else {
        const text = this.getActiveDocumentText();
        if (text) {
          this.analyzeCurrentDocument().then(() => {
            window.ObligationTimelineUI.renderFromActiveDoc();
          }).catch(() => window.ObligationTimelineUI.renderFromActiveDoc());
        } else {
          window.ObligationTimelineUI.renderFromActiveDoc();
        }
      }
    }
    if (tabId === 'compareTab' && window.ContractComparatorUI) {
      const docA = document.getElementById('compareDocA');
      const docB = document.getElementById('compareDocB');
      if (docA && docB && (!docA.value || !docB.value)) {
        window.ContractComparatorUI.loadNdaSample();
      }
    }
  }

  bindDocumentInput() {
    const textarea = document.getElementById('documentInput');
    const analyzeBtn = document.getElementById('runAnalysisBtn');
    const fileUpload = document.getElementById('fileUploadInput');
    const dropzone = document.getElementById('dropZone');

    if (textarea) {
      textarea.addEventListener('input', () => {
        this.activeDocument = textarea.value.trim();
        this.updatePiiStatus(this.activeDocument);
      });
    }

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeCurrentDocument());
    }

    // File Drag & Drop
    if (dropzone && fileUpload) {
      dropzone.addEventListener('click', () => fileUpload.click());
      
      fileUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.readFile(e.target.files[0]);
        }
      });

      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dropzone.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dropzone.classList.remove('drag-active');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.readFile(e.dataTransfer.files[0]);
        }
      });
    }
  }

  async readFile(file) {
    try {
      let content = '';
      if (window.DocumentParser) {
        content = await window.DocumentParser.parseFile(file);
      } else {
        content = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(file);
        });
      }

      if (!content || content.length < 10) {
        alert('Could not extract text from the file. Please ensure it is a valid document.');
        return;
      }

      const textarea = document.getElementById('documentInput');
      if (textarea) {
        textarea.value = content;
        this.activeDocument = content;
        this.updatePiiStatus(content);
        this.showToast(`Extracted clean text from: ${file.name}`);
        this.analyzeCurrentDocument();
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert(`Failed to parse file: ${err.message}`);
    }
  }

  bindSampleSelector() {
    const selector = document.getElementById('sampleDocSelect');
    if (selector) {
      selector.addEventListener('change', (e) => {
        const key = e.target.value;
        if (!key) return; // ignore placeholder selection
        if (key && window.SAMPLE_DOCUMENTS && window.SAMPLE_DOCUMENTS[key]) {
          const doc = window.SAMPLE_DOCUMENTS[key];
          const textarea = document.getElementById('documentInput');
          if (textarea) {
            textarea.value = doc.text;
            this.activeDocument = doc.text;
            this.updatePiiStatus(doc.text);
            this.showToast(`\u2705 Loaded: ${doc.title}`);
            // Reset selector so the same option can be re-selected next time
            setTimeout(() => { selector.value = ''; }, 50);
            this.analyzeCurrentDocument();
          }
        }
      });
    }
  }

  loadInitialSample() {
    // Reset selector to placeholder so every option always fires `change`
    const selector = document.getElementById('sampleDocSelect');
    if (selector) {
      // Insert placeholder option if not present
      if (!selector.querySelector('option[value=""]')) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '— Select a sample contract —';
        placeholder.disabled = true;
        selector.insertBefore(placeholder, selector.firstChild);
      }
      selector.value = ''; // Always reset so re-selection fires change
    }

    if (window.SAMPLE_DOCUMENTS && window.SAMPLE_DOCUMENTS.lease) {
      const doc = window.SAMPLE_DOCUMENTS.lease;
      const textarea = document.getElementById('documentInput');
      if (textarea) {
        textarea.value = doc.text;
        this.activeDocument = doc.text;
        this.updatePiiStatus(doc.text);
        // Auto analyze initial sample for instant wow-factor
        setTimeout(() => this.analyzeCurrentDocument(), 300);
      }
    }
  }

  updatePiiStatus(rawText) {
    if (window.PiiClient) {
      const pii = window.PiiClient.sanitizeLocal(rawText);
      window.PiiClient.renderShieldBadge('piiShieldContainer', pii);
    }
  }

  async analyzeCurrentDocument() {
    const textarea = document.getElementById('documentInput');
    // Always prefer live textarea content; fall back to cached activeDocument
    const text = (textarea && textarea.value.trim()) ? textarea.value.trim() : (this.activeDocument || '');

    if (!text || text.length < 30) {
      alert('Please paste or upload a legal document to analyze (minimum 30 characters).');
      return;
    }

    this.activeDocument = text;
    const analyzeBtn = document.getElementById('runAnalysisBtn');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = `<span>\u23F3 Analyzing Clauses...</span>`;
    }

    try {
      const autoSanitize = document.getElementById('autoSanitizeCheck')?.checked ?? true;
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, autoSanitize })
      });

      const json = await res.json();
      if (json.success) {
        window.DocumentAnalyzerUI.render(json.data);
        this.showToast('Analysis complete! Review your safety score and flagged traps.');
      } else {
        alert(`Analysis failed: ${json.error}`);
      }
    } catch (e) {
      console.error('Analysis network error:', e);
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<span>Analyze Document</span>`;
      }
    }
  }

  getActiveDocumentText() {
    const textarea = document.getElementById('documentInput');
    if (textarea && textarea.value.trim()) {
      return textarea.value.trim();
    }
    return this.activeDocument || (window.SAMPLE_DOCUMENTS ? window.SAMPLE_DOCUMENTS.lease.text : '');
  }

  bindSettingsModal() {
    const openBtn = document.getElementById('openSettingsBtn');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const modal = document.getElementById('settingsModal');
    const keyInput = document.getElementById('geminiApiKeyInput');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        if (keyInput) keyInput.value = localStorage.getItem('lexi_gemini_key') || '';
        modal.classList.remove('hidden');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (saveBtn && modal) {
      saveBtn.addEventListener('click', () => {
        const val = keyInput ? keyInput.value.trim() : '';
        if (val) {
          localStorage.setItem('lexi_gemini_key', val);
          this.showToast('Saved Gemini API Key!');
        } else {
          localStorage.removeItem('lexi_gemini_key');
          this.showToast('Switched to LexiClarity Local Legal Engine.');
        }
        modal.classList.add('hidden');
      });
    }
  }

  showToast(message) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3200);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LexiClarityApp();
});
