/**
 * LexiClarity - What-If Legal Scenario Simulator UI
 * Simulates hypothetical legal outcomes against document terms.
 */

class ScenarioSimulatorUI {
  static init() {
    const runBtn = document.getElementById('runScenarioBtn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCustomScenario());
    }

    // Preset scenario buttons
    document.querySelectorAll('.scenario-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.dataset.prompt;
        if (prompt) {
          const input = document.getElementById('scenarioInput');
          if (input) input.value = prompt;
          this.executeSimulation(prompt);
        }
      });
    });
  }

  static runCustomScenario() {
    const input = document.getElementById('scenarioInput');
    const prompt = input ? input.value.trim() : '';
    if (!prompt) {
      alert('Please describe a hypothetical scenario or click one of the preset cards above.');
      return;
    }
    this.executeSimulation(prompt);
  }

  static async executeSimulation(scenarioPrompt) {
    const activeDoc = window.app.getActiveDocumentText();
    if (!activeDoc) {
      alert('Please select or upload a document in the Analyzer tab first.');
      window.app.switchTab('analyzerTab');
      return;
    }

    const outputArea = document.getElementById('scenarioOutput');
    if (!outputArea) return;

    outputArea.classList.remove('hidden');
    outputArea.innerHTML = `<div class="loading-spinner">Simulating legal outcome and exposure against contract clauses...</div>`;

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scenarioPrompt,
          documentText: activeDoc
        })
      });

      const json = await res.json();
      if (json.success) {
        this.renderOutcome(json.data);
      } else {
        outputArea.innerHTML = `<p class="error-msg">Simulation error: ${json.error}</p>`;
      }
    } catch (e) {
      outputArea.innerHTML = `<p class="error-msg">Network error: ${e.message}</p>`;
    }
  }

  static renderOutcome(data) {
    const outputArea = document.getElementById('scenarioOutput');
    if (!outputArea) return;

    outputArea.innerHTML = `
      <div class="simulation-outcome-card">
        <div class="outcome-header">
          <div class="outcome-meta">
            <span class="outcome-risk-badge ${data.riskLevel.toLowerCase().includes('high') ? 'danger' : 'warning'}">
              Risk Level: ${data.riskLevel}
            </span>
          </div>
          <h3 class="outcome-title">Scenario Outcome Analysis</h3>
          <p class="outcome-prompt"><em>"${data.scenarioPrompt}"</em></p>
        </div>

        <div class="outcome-grid">
          <div class="outcome-block">
            <h4>📋 Likely Contractual Outcome:</h4>
            <p>${data.outcomeSummary}</p>
          </div>

          <div class="outcome-block penalties">
            <h4>⚠️ Financial / Legal Penalties:</h4>
            <p>${data.potentialPenalties}</p>
          </div>
        </div>

        <div class="outcome-actions-box">
          <h4>🛡️ Mandatory Protective Steps:</h4>
          <ul>
            ${data.requiredActions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>

        <div class="outcome-referenced-clauses">
          <h4>📄 Applicable Governing Clauses:</h4>
          <div class="relevant-clauses-grid">
            ${data.relevantClauses.map(c => `
              <div class="rel-clause-item">
                <span class="rel-clause-title">${c.title} (${c.category})</span>
                <p class="rel-clause-snippet">"${c.snippet}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="outcome-footer">
          <button type="button" class="btn-subtle" onclick="window.accessibility.speakText('${escape(data.outcomeSummary + ' ' + data.potentialPenalties)}')">
            🔊 Listen to Scenario Forecast
          </button>
        </div>
      </div>
    `;

    outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.ScenarioSimulatorUI = ScenarioSimulatorUI;
