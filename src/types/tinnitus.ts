export type EarSide = 'left' | 'right' | 'both';

export type ToneWaveform = 'sine' | 'triangle' | 'soft-pulse';

export interface CRChannel {
  index: number;         // 1 to 4
  frequency: number;     // Hz
  color: string;         // Hex code
  label: string;         // 'f1', 'f2', 'f3', 'f4'
  ratio: number;         // relative ratio to fT
}

export type RIResponse = 'complete' | 'partial' | 'unchanged' | 'worse';

export interface ResidualInhibitionResult {
  id: string;
  timestamp: string;
  frequency: number;
  stimulusDurationSeconds: number; // usually 60
  response: RIResponse;
  inhibitionDurationSeconds?: number; // how long relief lasted (e.g. 45s, 120s)
  notes?: string;
}

export interface CalibrationRecord {
  id: string;
  timestamp: string;
  frequency: number;
  earSide: EarSide;
  thresholdVolume: number;
  therapeuticVolume: number;
  riTested?: boolean;
  riResult?: RIResponse;
}

export interface UserProfile {
  id: string;
  name: string;
  targetFrequency: number;     // f_T in Hz (default ~4000-8000 Hz)
  earSide: EarSide;
  thresholdVolume: number;     // 0 to 1 (Hearing threshold)
  therapeuticVolume: number;   // 0 to 1 (Sensation level volume)
  balance: number;             // -1 (Left) to +1 (Right), 0 = center
  crCycleSpeedHz: number;      // 1.0 to 2.2 Hz (default 1.5 Hz)
  tonesPerCycle: number;       // 4
  onCycles: number;            // 3 cycles active
  offCycles: number;           // 2 cycles silent (Tass 3:2 protocol)
  noiseType: 'none' | 'pink' | 'ocean' | 'brown';
  noiseVolume: number;         // 0 to 1
  waveform?: ToneWaveform;     // 'sine' or 'triangle' (soft harmonic)
  isCalibrated: boolean;
  lastCalibratedAt?: string;
  createdAt: string;
  calibrationHistory?: CalibrationRecord[];
  riHistory?: ResidualInhibitionResult[];
}

export interface SessionRecord {
  id: string;
  timestamp: string;
  durationSeconds: number;     // Actual completed listening time
  targetFrequency: number;
  preVASLoudness?: number;     // 0 to 10 Visual Analog Scale
  postVASLoudness?: number;    // 0 to 10
  preVASDistress?: number;     // 0 to 10
  postVASDistress?: number;    // 0 to 10
  notes?: string;
}

export interface AudioEngineState {
  isPlaying: boolean;
  isPaused: boolean;
  currentChannelIndex: number | null; // 0, 1, 2, 3 or null (when silent/between tones)
  currentFrequency: number | null;
  cycleIndex: number;          // 0 to 4 (0, 1, 2 = ON, 3, 4 = OFF for 3:2)
  isSilenceCycle: boolean;
  elapsedSeconds: number;
  targetDurationSeconds: number; // e.g. 1800 (30 min)
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessionCount: number;
  avgLoudness?: number;
}
