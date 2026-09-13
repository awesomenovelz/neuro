import React, { useState, useEffect } from 'react';
import { EarSide } from '../../types/tinnitus';
import { Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../../audio/AudioEngine';

interface LoudnessMatcherProps {
  frequency: number;
  earSide: EarSide;
  onEarSideChange: (ear: EarSide) => void;
  thresholdVolume: number;
  onThresholdVolumeChange: (vol: number) => void;
  therapeuticVolume: number;
  onTherapeuticVolumeChange: (vol: number) => void;
}

export const LoudnessMatcher: React.FC<LoudnessMatcherProps> = ({
  frequency,
  earSide,
  onEarSideChange,
  thresholdVolume,
  onThresholdVolumeChange,
  therapeuticVolume,
  onTherapeuticVolumeChange,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    return () => {
      audioEngine.stopCalibrationTone();
    };
  }, []);

  const toggleTest = () => {
    if (isPlayingTest) {
      audioEngine.stopCalibrationTone();
      setIsPlayingTest(false);
    } else {
      audioEngine.setEarSide(earSide);
      audioEngine.startCalibrationTone(frequency, therapeuticVolume);
      setIsPlayingTest(true);
    }
  };

  const handleEarChange = (side: EarSide) => {
    onEarSideChange(side);
    audioEngine.setEarSide(side);
  };

  const handleThresholdChange = (val: number) => {
    onThresholdVolumeChange(val);
    // Standard CR protocol: therapeutic volume is slightly above hearing threshold (+ ~15-20% gain or 5-10 dB SL)
    const autoTherapeutic = Math.min(1.0, Math.max(0.05, val * 1.5 + 0.1));
    onTherapeuticVolumeChange(Math.round(autoTherapeutic * 100) / 100);

    if (isPlayingTest) {
      audioEngine.updateCalibrationVolume(autoTherapeutic);
    }
  };

  const handleTherapeuticChange = (val: number) => {
    onTherapeuticVolumeChange(val);
    if (isPlayingTest) {
      audioEngine.updateCalibrationVolume(val);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ear Side Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          1. В каком ухе слышен тиннитус?
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleEarChange('left')}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              earSide === 'left'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10'
                : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-850 hover:text-slate-200'
            }`}
          >
            Левое ухо
          </button>
          <button
            onClick={() => handleEarChange('both')}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              earSide === 'both'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10'
                : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-850 hover:text-slate-200'
            }`}
          >
            Оба уха (в голове)
          </button>
          <button
            onClick={() => handleEarChange('right')}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              earSide === 'right'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10'
                : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-850 hover:text-slate-200'
            }`}
          >
            Правое ухо
          </button>
        </div>
      </div>

      {/* Hearing Threshold Slider */}
      <div className="p-4 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              2. Порог слышимости (Hearing Threshold)
            </span>
            <p className="text-xs text-slate-400">
              Установите уровень, при котором тон {frequency} Гц едва различим в тишине.
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-sky-400">
            {Math.round(thresholdVolume * 100)}%
          </span>
        </div>

        <input
          type="range"
          min="0.01"
          max="0.8"
          step="0.01"
          value={thresholdVolume}
          onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />
      </div>

      {/* Sensation Level / Therapeutic Volume */}
      <div className="p-4 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                3. Терапевтическая громкость (Sensation Level)
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                +10 дБ SL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              По протоколу Тасса стимуляция должна быть комфортной — чуть громче порога слышимости, но <strong>не заглушать</strong> окружающую речь.
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-400">
            {Math.round(therapeuticVolume * 100)}%
          </span>
        </div>

        <input
          type="range"
          min="0.05"
          max="1.0"
          step="0.01"
          value={therapeuticVolume}
          onChange={(e) => handleTherapeuticChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
      </div>

      {/* Safety Notice & Test Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Включена защита слуха (мастер-лимитер и компрессор)</span>
        </div>

        <button
          onClick={toggleTest}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs transition-all ${
            isPlayingTest
              ? 'bg-amber-500 text-neuro-950 shadow-md shadow-amber-500/20'
              : 'bg-neuro-800 hover:bg-neuro-750 text-slate-200 border border-neuro-700'
          }`}
        >
          {isPlayingTest ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span>Стоп проверка</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Проверить громкость</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
