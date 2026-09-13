/**
 * Safety Limiter & Dynamic Compression Node
 * Protects user's hearing against unexpected volume spikes, clipping,
 * and high acoustic energy levels.
 */

export function createSafetyCompressor(ctx: AudioContext): DynamicsCompressorNode {
  const compressor = ctx.createDynamicsCompressor();
  // Aggressive brickwall-style protection for medical audio safety
  compressor.threshold.setValueAtTime(-6.0, ctx.currentTime); // start compressing at -6dB
  compressor.knee.setValueAtTime(3.0, ctx.currentTime);       // soft knee
  compressor.ratio.setValueAtTime(16.0, ctx.currentTime);     // 16:1 ratio (hard limiting)
  compressor.attack.setValueAtTime(0.003, ctx.currentTime);   // 3ms attack
  compressor.release.setValueAtTime(0.08, ctx.currentTime);   // 80ms release
  return compressor;
}
