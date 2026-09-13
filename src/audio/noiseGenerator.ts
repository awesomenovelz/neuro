/**
 * Procedural Noise & Ambient Sound Generator
 * Generates Pink Noise, Brown Noise, and Ocean Swell sounds
 * without needing external audio asset downloads.
 */

export class NoiseGenerator {
  private ctx: AudioContext;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  public isRunning: boolean = false;

  constructor(ctx: AudioContext, destinationNode: AudioNode) {
    this.ctx = ctx;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gainNode.connect(destinationNode);
  }

  public setVolume(volume: number, rampTime = 0.05) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.setTargetAtTime(clamped * 0.4, this.ctx.currentTime, rampTime);
  }

  public start(type: 'pink' | 'ocean' | 'brown') {
    this.stop();
    if (type === 'none' as unknown) return;

    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds looping buffer
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const output = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let lastBrown = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;

        if (type === 'pink' || type === 'ocean') {
          // Paul Kellet's refined pinking filter
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else if (type === 'brown') {
          // Brownian (red) noise integration
          lastBrown = (lastBrown + (0.02 * white)) / 1.02;
          output[i] = lastBrown * 3.5;
        }
      }
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    if (type === 'ocean') {
      // Ocean wave filter modulated by slow LFO (~0.12 Hz swell)
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(450, this.ctx.currentTime);
      lowpass.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10s wave period

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(320, this.ctx.currentTime); // modulate ±320 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);
      lfo.start();

      noiseSource.connect(lowpass);
      lowpass.connect(this.gainNode);

      this.filterNode = lowpass;
      this.lfoNode = lfo;
      this.lfoGain = lfoGain;
    } else {
      noiseSource.connect(this.gainNode);
    }

    noiseSource.start();
    this.noiseNode = noiseSource;
    this.isRunning = true;
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch {
        // already stopped
      }
      this.noiseNode = null;
    }
    if (this.lfoNode) {
      try {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
      } catch {
        // already stopped
      }
      this.lfoNode = null;
    }
    if (this.lfoGain) {
      try {
        this.lfoGain.disconnect();
      } catch {
        // already stopped
      }
      this.lfoGain = null;
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }
    this.isRunning = false;
  }
}
