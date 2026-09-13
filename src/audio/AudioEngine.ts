import { CRChannel, UserProfile, EarSide, ToneWaveform } from '../types/tinnitus';
import { calculateCRChannels, generateRandomCycleOrder } from './crCalculator';
import { createSafetyCompressor } from './safetyLimiter';
import { NoiseGenerator } from './noiseGenerator';

export interface ToneEvent {
  channelIndex: number; // 0..3
  frequency: number;
  time: number;
  duration: number;
}

export type ToneCallback = (event: ToneEvent) => void;
export type CycleCallback = (cycleIndex: number, isSilence: boolean) => void;
export type TickCallback = (elapsedSeconds: number, remainingSeconds: number) => void;
export type StateCallback = (isPlaying: boolean) => void;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseGen: NoiseGenerator | null = null;

  // Calibration tone nodes
  private calibOsc: OscillatorNode | null = null;
  private calibGain: GainNode | null = null;
  private calibBaseVolume: number = 0.3;

  /**
   * Fletcher-Munson bass compensation factor for human hearing threshold below 350 Hz
   */
  private getEqualLoudnessGain(freq: number): number {
    if (freq >= 350) return 1.0;
    const logRatio = Math.log10(350 / Math.max(20, freq));
    return Math.min(2.4, 1.0 + logRatio * 1.15);
  }

  // Residual Inhibition stimulus nodes
  private riNoiseNode: AudioBufferSourceNode | null = null;
  private riFilterNode: BiquadFilterNode | null = null;
  private riGainNode: GainNode | null = null;
  private riOscNode: OscillatorNode | null = null;

  // CR Therapy state
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private profile: UserProfile | null = null;
  private channels: CRChannel[] = [];
  
  // High-precision scheduling
  private lookaheadMs: number = 25.0; // schedule interval in ms
  private scheduleAheadSec: number = 0.12; // schedule ahead window
  private nextToneTime: number = 0.0;
  private currentCycle: number = 0; // 0, 1, 2 (ON), 3, 4 (OFF)
  private currentToneInCycle: number = 0; // 0..3
  private currentPermutation: number[] = [0, 1, 2, 3];
  private timerId: number | null = null;
  private animationFrameId: number | null = null;

  // Session timing
  private sessionStartTime: number = 0;
  private sessionDurationSeconds: number = 1800; // default 30 min
  private elapsedBeforePause: number = 0;
  private lastTickSecond: number = -1;

  // Event callbacks
  private onToneTrigger?: ToneCallback;
  private onCycleChange?: CycleCallback;
  private onTick?: TickCallback;
  private onStateChange?: StateCallback;
  private onSessionComplete?: () => void;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Compressor / Limiter
      this.compressor = createSafetyCompressor(this.ctx);
      this.compressor.connect(this.ctx.destination);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Stereo Panner (or fallback)
      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
        this.masterGain.connect(this.pannerNode);
        this.pannerNode.connect(this.compressor);
      } else {
        this.masterGain.connect(this.compressor);
      }

      // Background Noise Generator
      this.noiseGen = new NoiseGenerator(this.ctx, this.compressor);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setCallbacks(callbacks: {
    onToneTrigger?: ToneCallback;
    onCycleChange?: CycleCallback;
    onTick?: TickCallback;
    onStateChange?: StateCallback;
    onSessionComplete?: () => void;
  }) {
    this.onToneTrigger = callbacks.onToneTrigger;
    this.onCycleChange = callbacks.onCycleChange;
    this.onTick = callbacks.onTick;
    this.onStateChange = callbacks.onStateChange;
    this.onSessionComplete = callbacks.onSessionComplete;
  }

  public setEarSide(ear: EarSide) {
    if (!this.pannerNode || !this.ctx) return;
    if (ear === 'left') {
      this.pannerNode.pan.setTargetAtTime(-1.0, this.ctx.currentTime, 0.05);
    } else if (ear === 'right') {
      this.pannerNode.pan.setTargetAtTime(1.0, this.ctx.currentTime, 0.05);
    } else {
      this.pannerNode.pan.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
    }
  }

  public setMasterVolume(vol: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  public setNoise(type: 'none' | 'pink' | 'ocean' | 'brown', volume: number) {
    if (!this.noiseGen) return;
    if (type === 'none' || volume <= 0) {
      this.noiseGen.stop();
    } else {
      this.noiseGen.start(type);
      this.noiseGen.setVolume(volume);
    }
  }

  // ==========================================
  // CALIBRATION / PITCH-MATCHING TONE GENERATOR
  // ==========================================

  public startCalibrationTone(frequency: number, volume: number = 0.3, waveform: ToneWaveform = 'sine') {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.stopCalibrationTone();
    this.calibBaseVolume = volume;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveform === 'triangle' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    const bassGain = this.getEqualLoudnessGain(frequency);
    const targetGain = Math.max(0.001, Math.min(0.9, volume * 0.5 * bassGain));

    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.calibOsc = osc;
    this.calibGain = gain;
  }

  public updateCalibrationFrequency(frequency: number) {
    if (this.calibOsc && this.ctx) {
      this.calibOsc.frequency.setTargetAtTime(frequency, this.ctx.currentTime, 0.02);
      if (this.calibGain) {
        const bassGain = this.getEqualLoudnessGain(frequency);
        const targetGain = Math.max(0.001, Math.min(0.9, this.calibBaseVolume * 0.5 * bassGain));
        this.calibGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
      }
    }
  }

  public updateCalibrationVolume(volume: number) {
    this.calibBaseVolume = volume;
    if (this.calibGain && this.calibOsc && this.ctx) {
      const currentFreq = this.calibOsc.frequency.value;
      const bassGain = this.getEqualLoudnessGain(currentFreq);
      const targetGain = Math.max(0.001, Math.min(0.9, volume * 0.5 * bassGain));
      this.calibGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setCalibrationWaveform(waveform: ToneWaveform) {
    if (this.calibOsc) {
      this.calibOsc.type = waveform === 'triangle' ? 'triangle' : 'sine';
    }
  }

  public stopCalibrationTone() {
    if (this.calibGain && this.calibOsc && this.ctx) {
      try {
        this.calibGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
        setTimeout(() => {
          try {
            this.calibOsc?.stop();
            this.calibOsc?.disconnect();
            this.calibGain?.disconnect();
          } catch {
            // safely handle already disconnected
          }
          this.calibOsc = null;
          this.calibGain = null;
        }, 50);
      } catch {
        this.calibOsc = null;
        this.calibGain = null;
      }
    }
  }

  // ==========================================
  // RESIDUAL INHIBITION (RI) ACOUSTIC TEST
  // ==========================================

  public startRIStimulus(frequency: number, volume: number = 0.4, mode: 'narrowband' | 'tone' = 'narrowband') {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.stopRIStimulus();

    const gain = this.ctx.createGain();
    const safeVolume = Math.max(0.02, Math.min(0.6, volume * 0.7));

    // Smooth 0.8s fade-in to prevent startle reflex
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(safeVolume, this.ctx.currentTime + 0.8);
    gain.connect(this.masterGain);
    this.riGainNode = gain;

    if (mode === 'narrowband') {
      // Create 2-second looped noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Narrow band-pass centered directly on tinnitus frequency f_T
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      filter.Q.setValueAtTime(7.0, this.ctx.currentTime); // narrow acoustic band around f_T

      noiseSource.connect(filter);
      filter.connect(gain);
      noiseSource.start();

      this.riNoiseNode = noiseSource;
      this.riFilterNode = filter;
    } else {
      // Modulated tone mode (±35 Hz pitch vibrato at 3.5 Hz)
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      const vibrato = this.ctx.createOscillator();
      vibrato.frequency.setValueAtTime(3.5, this.ctx.currentTime);
      const vibratoGain = this.ctx.createGain();
      vibratoGain.gain.setValueAtTime(35, this.ctx.currentTime);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start();

      osc.connect(gain);
      osc.start();

      this.riOscNode = osc;
    }
  }

  public stopRIStimulus() {
    if (this.riGainNode && this.ctx) {
      try {
        // Smooth 0.5s fade-out
        this.riGainNode.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
        setTimeout(() => {
          try {
            if (this.riNoiseNode) {
              this.riNoiseNode.stop();
              this.riNoiseNode.disconnect();
              this.riNoiseNode = null;
            }
            if (this.riOscNode) {
              this.riOscNode.stop();
              this.riOscNode.disconnect();
              this.riOscNode = null;
            }
            if (this.riFilterNode) {
              this.riFilterNode.disconnect();
              this.riFilterNode = null;
            }
            if (this.riGainNode) {
              this.riGainNode.disconnect();
              this.riGainNode = null;
            }
          } catch {
            // safely handle already disconnected
          }
        }, 300);
      } catch {
        this.riNoiseNode = null;
        this.riOscNode = null;
        this.riFilterNode = null;
        this.riGainNode = null;
      }
    }
  }

  // ==========================================
  // ACOUSTIC CR THERAPY SCHEDULER
  // ==========================================

  public startTherapy(profile: UserProfile, targetDurationSeconds: number = 1800) {
    this.init();
    if (!this.ctx) return;

    this.profile = profile;
    this.channels = calculateCRChannels(profile.targetFrequency);
    this.sessionDurationSeconds = targetDurationSeconds;
    this.setEarSide(profile.earSide);
    this.setMasterVolume(profile.therapeuticVolume);
    this.setNoise(profile.noiseType, profile.noiseVolume);

    this.isPlaying = true;
    this.isPaused = false;
    this.currentCycle = 0;
    this.currentToneInCycle = 0;
    this.currentPermutation = generateRandomCycleOrder();
    this.nextToneTime = this.ctx.currentTime + 0.1;
    this.sessionStartTime = this.ctx.currentTime;
    this.elapsedBeforePause = 0;
    this.lastTickSecond = -1;

    this.onStateChange?.(true);
    this.onCycleChange?.(this.currentCycle, false);

    // Setup MediaSession for background audio playback on mobile/desktops
    this.setupMediaSession();

    // Start scheduling loop
    this.runScheduler();
  }

  public pauseTherapy() {
    if (!this.isPlaying || this.isPaused || !this.ctx) return;
    this.isPaused = true;
    this.elapsedBeforePause = this.getElapsedSeconds();
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.noiseGen?.stop();
    this.onStateChange?.(false);
  }

  public resumeTherapy() {
    if (!this.isPlaying || !this.isPaused || !this.ctx) return;
    this.isPaused = false;
    this.nextToneTime = this.ctx.currentTime + 0.1;
    this.sessionStartTime = this.ctx.currentTime - this.elapsedBeforePause;
    if (this.profile) {
      this.setNoise(this.profile.noiseType, this.profile.noiseVolume);
    }
    this.onStateChange?.(true);
    this.runScheduler();
  }

  public stopTherapy() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.noiseGen?.stop();
    this.onStateChange?.(false);
  }

  public getElapsedSeconds(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    if (this.isPaused) return this.elapsedBeforePause;
    return Math.max(0, Math.floor(this.ctx.currentTime - this.sessionStartTime));
  }

  public getChannels(): CRChannel[] {
    return this.channels;
  }

  private runScheduler = () => {
    if (!this.isPlaying || this.isPaused || !this.ctx || !this.profile) return;

    const cycleHz = this.profile.crCycleSpeedHz || 1.5;
    const cycleDuration = 1.0 / cycleHz; // e.g. 0.666s
    const toneInterval = cycleDuration / 4; // 4 tone slots per cycle
    const toneDuration = Math.min(0.12, toneInterval * 0.75); // ~100-120ms

    // Schedule any tones falling within the lookahead window
    while (this.nextToneTime < this.ctx.currentTime + this.scheduleAheadSec) {
      const isSilenceCycle = this.currentCycle >= 3; // cycles 3 & 4 are silent in 3:2 protocol

      if (!isSilenceCycle) {
        // Active stimulation cycle
        const channelIdx = this.currentPermutation[this.currentToneInCycle];
        const channel = this.channels[channelIdx];

        if (channel) {
          this.scheduleTone(channel.frequency, channelIdx, this.nextToneTime, toneDuration);
        }
      }

      // Advance tone slot
      this.nextToneTime += toneInterval;
      this.currentToneInCycle++;

      // When all 4 slots in a cycle are processed
      if (this.currentToneInCycle >= 4) {
        this.currentToneInCycle = 0;
        this.currentCycle = (this.currentCycle + 1) % 5; // 0, 1, 2 (ON), 3, 4 (OFF)
        this.currentPermutation = generateRandomCycleOrder();

        const silenceNext = this.currentCycle >= 3;
        this.onCycleChange?.(this.currentCycle, silenceNext);
      }
    }

    // Handle timer tick and session progress
    const elapsed = this.getElapsedSeconds();
    const remaining = Math.max(0, this.sessionDurationSeconds - elapsed);

    if (elapsed !== this.lastTickSecond) {
      this.lastTickSecond = elapsed;
      this.onTick?.(elapsed, remaining);

      // Check session completion
      if (this.sessionDurationSeconds > 0 && elapsed >= this.sessionDurationSeconds) {
        this.handleSessionCompleted();
        return;
      }
    }

    this.timerId = window.setTimeout(this.runScheduler, this.lookaheadMs);
  };

  /**
   * Schedules a single CR stimulation tone with smooth Hanning envelope
   * to guarantee click-free pure tone emission.
   */
  private scheduleTone(frequency: number, channelIndex: number, startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const oscType: OscillatorType = this.profile?.waveform === 'triangle' ? 'triangle' : 'sine';
    osc.type = oscType;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Hanning envelope: 15ms ramp up, hold, 15ms ramp down
    const attackTime = 0.015;
    const releaseTime = 0.015;
    const bassGain = this.getEqualLoudnessGain(frequency);
    const peakVolume = Math.min(0.85, 0.5 * bassGain); // Scaled with equal-loudness compensation

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + attackTime);
    gain.gain.setValueAtTime(peakVolume, startTime + duration - releaseTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);

    // Schedule UI event trigger synchronized with real audio clock
    const delayUntilVisualMs = Math.max(0, (startTime - this.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying && !this.isPaused) {
        this.onToneTrigger?.({
          channelIndex,
          frequency,
          time: startTime,
          duration,
        });
      }
    }, delayUntilVisualMs);
  }

  private handleSessionCompleted() {
    this.stopTherapy();
    this.onSessionComplete?.();
  }

  private setupMediaSession() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Acoustic CR Neuromodulation Therapy',
        artist: 'NeuroReset',
        album: 'Tinnitus Retraining Protocol',
      });

      navigator.mediaSession.setActionHandler('play', () => this.resumeTherapy());
      navigator.mediaSession.setActionHandler('pause', () => this.pauseTherapy());
      navigator.mediaSession.setActionHandler('stop', () => this.stopTherapy());
    }
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();
