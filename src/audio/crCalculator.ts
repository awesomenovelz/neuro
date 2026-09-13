import { CRChannel } from '../types/tinnitus';

/**
 * Calculates 4 stimulation frequencies according to the Acoustic CR Neuromodulation
 * protocol (Prof. Peter Tass / Forschungszentrum Jülich).
 *
 * In the standard CR protocol, 4 therapeutic frequencies (f1, f2 < fT < f3, f4)
 * are placed symmetrically in the cochleotopic space around the tinnitus frequency fT.
 *
 * Standard logarithmic cochleotopic ratios:
 * f1 ≈ fT * 2^(-0.50) ≈ 0.707 * fT  (or standard Tass: 0.77)
 * f2 ≈ fT * 2^(-0.20) ≈ 0.871 * fT  (or standard Tass: 0.90)
 * f3 ≈ fT * 2^(+0.20) ≈ 1.149 * fT  (or standard Tass: 1.10)
 * f4 ≈ fT * 2^(+0.50) ≈ 1.414 * fT  (or standard Tass: 1.40)
 */

export const CHANNEL_COLORS = [
  '#38bdf8', // f1 - Sky Blue
  '#34d399', // f2 - Emerald
  '#a78bfa', // f3 - Violet
  '#f472b6', // f4 - Pink
];

export const CR_DEFAULT_RATIOS = [
  0.77,  // f1 (low outer)
  0.90,  // f2 (low inner)
  1.10,  // f3 (high inner)
  1.40,  // f4 (high outer)
];

/**
 * Greenwood function converts frequency (Hz) to position along the human basilar membrane (mm).
 * A = 165.4, a = 0.06, k = 1.0 (for humans, x in mm from 0 to ~35mm)
 */
export function freqToGreenwood(freq: number): number {
  const f = Math.max(20, Math.min(20000, freq));
  return (1 / 0.06) * Math.log10((f / 165.4) + 1);
}

export function greenwoodToFreq(xMm: number): number {
  return 165.4 * (Math.pow(10, 0.06 * xMm) - 1);
}

/**
 * Computes the 4 CR stimulation channels for a given tinnitus target frequency fT.
 */
export function calculateCRChannels(fT: number): CRChannel[] {
  // Clamp fT safely between 20 Hz and 18,000 Hz (full human audible spectrum)
  const target = Math.max(20, Math.min(18000, fT));

  const freqs = CR_DEFAULT_RATIOS.map((ratio) => {
    let freq = Math.round(target * ratio);
    return Math.max(20, Math.min(19500, freq));
  });

  // Ensure strict ascending ordering for low frequencies (e.g. at 20-30 Hz)
  for (let i = 1; i < freqs.length; i++) {
    if (freqs[i] <= freqs[i - 1]) {
      freqs[i] = freqs[i - 1] + 1;
    }
  }

  return freqs.map((freq, index) => ({
    index: index + 1,
    frequency: freq,
    color: CHANNEL_COLORS[index],
    label: `f${index + 1}`,
    ratio: CR_DEFAULT_RATIOS[index],
  }));
}

/**
 * Generates a randomized permutation of the 4 channel indices [0, 1, 2, 3]
 * for a single CR stimulation cycle.
 * CR protocol requires random pseudo-order within each stimulation cycle to prevent habituation.
 */
export function generateRandomCycleOrder(): number[] {
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}
