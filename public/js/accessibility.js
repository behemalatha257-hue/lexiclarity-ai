/**
 * Accessibility & Universal Inclusion Suite
 * Sentimental Black & White (Paper White vs Obsidian Black) Theme Engine,
 * WCAG 2.1 AAA contrast, OpenDyslexic typography, Text-to-Speech (TTS), and multi-language controls.
 */

class AccessibilitySuite {
  constructor() {
    this.speechSynth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.currentFontSize = 16;
    this.activeTheme = 'light'; // 'light' (Paper White) or 'dark' (Obsidian Black)

    this.init();
  }

  init() {
    this.loadPreferences();
    this.bindEvents();
  }

  loadPreferences() {
    const savedTheme = localStorage.getItem('lexi_theme') || 'light';
    this.setTheme(savedTheme);

    const isDyslexic = localStorage.getItem('lexi_dyslexic') === 'true';
    const isHighContrast = localStorage.getItem('lexi_contrast') === 'true';
    const savedFontSize = parseInt(localStorage.getItem('lexi_font_size'), 10);

    if (isDyslexic) document.body.classList.add('dyslexia-mode');
    if (isHighContrast) document.body.classList.add('high-contrast');
    if (savedFontSize && savedFontSize >= 14 && savedFontSize <= 24) {
      this.currentFontSize = savedFontSize;
      document.documentElement.style.fontSize = `${this.currentFontSize}px`;
    }
  }

  bindEvents() {
    // Theme Switcher Button (Paper White vs Obsidian Black)
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Dyslexia mode toggle
    const dyslexiaBtn = document.getElementById('toggleDyslexiaBtn');
    if (dyslexiaBtn) {
      dyslexiaBtn.addEventListener('click', () => this.toggleDyslexia());
    }

    // High Contrast toggle
    const contrastBtn = document.getElementById('toggleContrastBtn');
    if (contrastBtn) {
      contrastBtn.addEventListener('click', () => this.toggleHighContrast());
    }

    // Font size controls
    const increaseBtn = document.getElementById('increaseFontBtn');
    const decreaseBtn = document.getElementById('decreaseFontBtn');
    const resetFontBtn = document.getElementById('resetFontBtn');

    if (increaseBtn) increaseBtn.addEventListener('click', () => this.adjustFontSize(2));
    if (decreaseBtn) decreaseBtn.addEventListener('click', () => this.adjustFontSize(-2));
    if (resetFontBtn) resetFontBtn.addEventListener('click', () => this.resetFontSize());

    // TTS Stop button
    const stopAudioBtn = document.getElementById('stopAudioBtn');
    if (stopAudioBtn) {
      stopAudioBtn.addEventListener('click', () => this.stopSpeaking());
    }
  }

  toggleTheme() {
    const nextTheme = this.activeTheme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
    this.announce(`Switched to ${nextTheme === 'dark' ? 'Obsidian Black' : 'Paper White'} monochrome theme`);
    if (window.app) {
      window.app.showToast(`Theme: ${nextTheme === 'dark' ? '⚫ Obsidian Black' : '⚪ Paper White'}`);
    }
  }

  setTheme(theme) {
    this.activeTheme = theme;
    localStorage.setItem('lexi_theme', theme);

    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);

    const icon = document.getElementById('themeToggleIcon');
    const text = document.getElementById('themeToggleText');

    if (icon) icon.textContent = isDark ? '⚪' : '⚫';
    if (text) text.textContent = isDark ? 'Paper White' : 'Obsidian Black';
  }

  toggleDyslexia() {
    const active = document.body.classList.toggle('dyslexia-mode');
    localStorage.setItem('lexi_dyslexic', active);
    this.announce(`Dyslexia-friendly typography ${active ? 'enabled' : 'disabled'}`);
    this.updateToggleButtons();
    if (window.app) window.app.showToast(`Dyslexia font ${active ? 'enabled' : 'disabled'}`);
  }

  toggleHighContrast() {
    const active = document.body.classList.toggle('high-contrast');
    localStorage.setItem('lexi_contrast', active);
    this.announce(`High-contrast mode ${active ? 'enabled' : 'disabled'}`);
    this.updateToggleButtons();
    if (window.app) window.app.showToast(`High contrast ${active ? 'enabled' : 'disabled'}`);
  }

  adjustFontSize(delta) {
    const newSize = Math.max(14, Math.min(24, this.currentFontSize + delta));
    this.currentFontSize = newSize;
    document.documentElement.style.fontSize = `${newSize}px`;
    localStorage.setItem('lexi_font_size', newSize);
    this.announce(`Font size changed to ${newSize} pixels`);
  }

  resetFontSize() {
    this.currentFontSize = 16;
    document.documentElement.style.fontSize = '16px';
    localStorage.removeItem('lexi_font_size');
    this.announce('Font size reset to default');
    if (window.app) window.app.showToast('Font size reset to default (16px)');
  }

  updateToggleButtons() {
    const dyslexiaBtn = document.getElementById('toggleDyslexiaBtn');
    const contrastBtn = document.getElementById('toggleContrastBtn');

    if (dyslexiaBtn) {
      dyslexiaBtn.setAttribute('aria-pressed', document.body.classList.contains('dyslexia-mode'));
    }
    if (contrastBtn) {
      contrastBtn.setAttribute('aria-pressed', document.body.classList.contains('high-contrast'));
    }
  }

  /**
   * Reads legal text aloud using browser Text-to-Speech
   */
  speakText(text, onEndCallback = null) {
    if (!this.speechSynth) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    this.stopSpeaking();

    let raw = text;
    try {
      if (raw.includes('%')) {
        raw = decodeURIComponent(raw);
      }
    } catch (e) {
      // ignore
    }

    const cleanText = raw
      .replace(/[*#_`>]/g, '')
      .replace(/\[REDACTED_.*?\]/g, 'Redacted Information')
      .replace(/https?:\/\/\S+/g, 'link');

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance.rate = 0.95;
    this.currentUtterance.pitch = 1.0;

    const bar = document.getElementById('audioPlaybackBar');
    if (bar) bar.classList.remove('hidden');

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      if (bar) bar.classList.add('hidden');
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance.onerror = () => {
      this.isSpeaking = false;
      if (bar) bar.classList.add('hidden');
    };

    this.isSpeaking = true;
    this.speechSynth.speak(this.currentUtterance);
    this.announce('Reading clause aloud.');
    if (window.app) window.app.showToast('🔊 Reading legal text aloud...');
  }

  stopSpeaking() {
    if (this.speechSynth && this.speechSynth.speaking) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
      const bar = document.getElementById('audioPlaybackBar');
      if (bar) bar.classList.add('hidden');
      this.announce('Audio reading stopped.');
    }
  }

  announce(message) {
    const liveRegion = document.getElementById('ariaLiveRegion');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }
}

window.accessibility = new AccessibilitySuite();
