/**
 * Bugmardini Voice Assistant - Natural Female Speech Synthesizer
 * Uses Web Speech API with automatic high-quality female voice selection.
 */

class BugmardiniVoice {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.selectedVoice = null;
    this.onStateChange = null;

    if (this.synth) {
      this._initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this._initVoices();
      }
    }
  }

  _initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer high-quality female English voices across OS platforms
    const preferredFemaleNames = [
      'Microsoft Zira',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Aria Online (Natural)',
      'Google US English Female',
      'Google UK English Female',
      'Samantha',
      'Victoria',
      'Karen',
      'Tessa',
      'Moira',
      'en-US-Standard-C',
      'en-US-Wavenet-C',
      'en-US-Wavenet-F',
    ];

    // 1. Try exact preferred names
    for (const name of preferredFemaleNames) {
      const match = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) {
        this.selectedVoice = match;
        return;
      }
    }

    // 2. Fallback: Search for any English voice with 'female' in name
    const anyFemale = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    );
    if (anyFemale) {
      this.selectedVoice = anyFemale;
      return;
    }

    // 3. Fallback: Any English voice
    const anyEn = voices.find((v) => v.lang.startsWith('en'));
    this.selectedVoice = anyEn || voices[0];
  }

  speak(text, onStartCallback = null, onEndCallback = null) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    this.stop();

    // Clean markdown symbols from spoken text
    const cleanText = text
      .replace(/[*#`_~[\]()]/g, '')
      .replace(/•/g, ', ')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Tuned for a clear, natural, articulate female engineer voice
    utterance.pitch = 1.05;
    utterance.rate = 0.98;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      if (onStartCallback) onStartCallback();
      if (this.onStateChange) this.onStateChange({ isSpeaking: true, isPaused: false });
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      if (onEndCallback) onEndCallback();
      if (this.onStateChange) this.onStateChange({ isSpeaking: false, isPaused: false });
    };

    utterance.onerror = (err) => {
      console.warn('Speech error:', err);
      this.isSpeaking = false;
      this.isPaused = false;
      if (onEndCallback) onEndCallback();
      if (this.onStateChange) this.onStateChange({ isSpeaking: false, isPaused: false });
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      if (this.onStateChange) this.onStateChange({ isSpeaking: true, isPaused: true });
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ isSpeaking: true, isPaused: false });
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      if (this.onStateChange) this.onStateChange({ isSpeaking: false, isPaused: false });
    }
  }
}

export const bugmardiniVoice = new BugmardiniVoice();

