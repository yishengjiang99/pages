// Note: These tests assume a browser environment with Mocha/Chai for AudioWorkletProcessor testing.
// Mock AudioWorkletProcessor, sampleRate, currentTime globally for testing.
// In a real setup, use a testing framework like karma with browser.

global.sampleRate = 44100; // Mock sampleRate
global.currentTime = 0; // Mock currentTime
global.AudioWorkletProcessor = class {}; // Basic mock

const { expect } = chai; // Assume chai is loaded

// Extract shared constants and class from worklets.js (loaded or copied here)
const notesFreqs = [];
for(let m = 40; m <= 84; m++) {
  notesFreqs[m] = 440 * Math.pow(2, (m - 69) / 12);
}

const N = 1024;
const hannWindow = new Float32Array(N);
const coefficients = new Float32Array(85);

for (let j = 0; j < N; j++) {
  hannWindow[j] = 0.5 * (1 - Math.cos(2 * Math.PI * j / (N - 1)));
}

for (let m = 40; m <= 84; m++) {
  coefficients[m] = 2 * Math.cos(2 * Math.PI * notesFreqs[m] / sampleRate * N);
}

class GoertzelProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(N);
    this.i = 0;
    this.port = { postMessage: () => {}, onmessage: () => {} }; // Mock port
    this.dynamicThreshold = -100;
  }

  process(inputs) {
    let input = inputs[0];
    if (!input || !input[0]) return true;

    let ch = input[0];
    for (let s of ch) {
      this.buf[this.i++] = s;

      if (this.i >= N) {
        const detectedNotes = [];

        for (let m = 40; m <= 84; m++) {
          let coeff = coefficients[m];
          let s1 = 0, s2 = 0;

          for (let j = 0; j < N; j++) {
            let win = this.buf[j] * hannWindow[j];
            let s0 = win + coeff * s1 - s2;
            s2 = s1;
            s1 = s0;
          }

          let power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
          let db = 10 * Math.log10(power / (N*N) + 1e-12);

          if (db > this.dynamicThreshold) {
            detectedNotes.push({midi: m, velocity: Math.min(127, Math.max(0, 100 + db))});
          }
        }

        this.port.postMessage({type: "notes", notes: detectedNotes, time: currentTime});
        this.i = 0;
      }
    }

    return true;
  }
}

describe('GoertzelProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new GoertzelProcessor();
  });

  it('should initialize correctly', () => {
    expect(processor.buf.length).to.equal(N);
    expect(processor.i).to.equal(0);
    expect(processor.dynamicThreshold).to.equal(-100);
  });

  it('should process input and detect notes above threshold', () => {
    const input = [new Float32Array(N).fill(1.0)]; // Mock input channel with constant signal
    const postMessageSpy = sinon.spy(processor.port, 'postMessage');
    processor.dynamicThreshold = -Infinity; // Force detection

    processor.process([input]);

    expect(postMessageSpy.called).to.be.true;
    const callArg = postMessageSpy.firstCall.args[0];
    expect(callArg.type).to.equal('notes');
    expect(callArg.notes.length).to.be.greaterThan(0); // Some notes should be detected
  });

  it('should not detect notes below threshold', () => {
    const input = [new Float32Array(N).fill(0.0001)]; // Low signal
    const postMessageSpy = sinon.spy(processor.port, 'postMessage');
    processor.dynamicThreshold = 0; // High threshold

    processor.process([input]);

    if (postMessageSpy.called) {
      const callArg = postMessageSpy.firstCall.args[0];
      expect(callArg.notes.length).to.equal(0);
    }
  });
});