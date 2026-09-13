import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle } from 'lucide-react';
import { audioEngine } from '../../audio/AudioEngine';

interface PitchMatcherProps {
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  volume: number;
}

const PRESET_FREQUENCIES = [
  { label: '1 кГц', value: 1000 },
  { label: '2 кГц', value: 2000 },
  { label: '3 кГц', value: 3000 },
  { label: '4 кГц', value: 4000 },
  { label: '6 кГц', value: 6000 },
  { label: '8 кГц', value: 8000 },
  { label: '10 кГц', value: 10000 },
  { label: '12 кГц', value: 12000 },
  { label: '14 кГц', value: 14000 },
];

export const PitchMatcher: React.FC<PitchMatcherProps> = ({
  frequency,
  onFrequencyChange,
  volume,
}) => {
  const [isPlayingTone, setIsPlayingTone] = useState(false);

  // Stop tone when unmounting
  useEffect(() => {
    return () => {
      audioEngine.stopCalibrationTone();
    };
  }, []);

  const toggleTone = () => {
    if (isPlayingTone) {
      audioEngine.stopCalibrationTone();
      setIsPlayingTone(false);
    } else {
      audioEngine.startCalibrationTone(frequency, volume);
      setIsPlayingTone(true);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFreq = parseInt(e.target.value, 10);
    onFrequencyChange(newFreq);
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(newFreq);
    }
  };

  const handleFineStep = (delta: number) => {
    const next = Math.max(500, Math.min(16000, frequency + delta));
    onFrequencyChange(next);
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(next);
    }
  };

  const handleSelectPreset = (freq: number) => {
    onFrequencyChange(freq);
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(freq);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation Banner */}
      <div className="p-4 rounded-xl bg-neuro-900 border border-neuro-800 text-sm text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sky-400">
          <HelpCircle className="w-4 h-4" />
          <span>Как определить частоту своего тиннитуса:</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          1. Наденьте наушники. Нажмите кнопку <strong>«Слушать тон»</strong>.<br />
          2. Выберите ближайший пресет (обычно тиннитус находится в диапазоне 4 000 – 10 000 Гц).<br />
          3. Плавно передвигайте ползунок и используйте кнопки точной подстройки (±10 Гц), пока высота звука не <strong>сольется с вашим звоном/писком</strong>.
        </p>
      </div>

      {/* Main Pitch Display & Audio Toggle */}
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-neuro-900 to-neuro-850 border border-neuro-800 relative overflow-hidden">
        <div className="text-center space-y-1 z-10">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Текущая частота тона (f_T)
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300">
              {frequency.toLocaleString('ru-RU')}
            </span>
            <span className="text-xl font-mono text-slate-400 font-semibold">Гц</span>
          </div>
        </div>

        {/* Big Test Tone Button */}
        <button
          onClick={toggleTone}
          className={`mt-5 flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all transform active:scale-95 shadow-lg ${
            isPlayingTone
              ? 'bg-amber-500 hover:bg-amber-400 text-neuro-950 shadow-amber-500/30 animate-pulse'
              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20'
          }`}
        >
          {isPlayingTone ? (
            <>
              <VolumeX className="w-5 h-5" />
              <span>Остановить тестовый тон</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>Слушать тестовый тон</span>
            </>
          )}
        </button>
      </div>

      {/* Frequency Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          Быстрые пресеты октав
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
          {PRESET_FREQUENCIES.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSelectPreset(preset.value)}
              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all ${
                Math.abs(frequency - preset.value) < 150
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 border border-sky-400'
                  : 'bg-neuro-900 text-slate-300 hover:bg-neuro-800 border border-neuro-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coarse Frequency Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>500 Гц (Низкий)</span>
          <span className="text-sky-400 font-semibold">{frequency} Гц</span>
          <span>16 000 Гц (Высокий писк)</span>
        </div>
        <input
          type="range"
          min="500"
          max="16000"
          step="25"
          value={frequency}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-neuro-900 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
        />
      </div>

      {/* Fine-Tuning Step Controls */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          Точная подстройка частоты
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleFineStep(-100)}
            className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
          >
            -100 Гц
          </button>
          <button
            onClick={() => handleFineStep(-10)}
            className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
          >
            -10 Гц
          </button>
          <button
            onClick={() => handleFineStep(-1)}
            className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
          >
            -1 Гц
          </button>

          <div className="flex items-center gap-1 px-3 py-1 bg-neuro-850 rounded-lg border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-xs font-bold text-sky-300">{frequency} Гц</span>
          </div>

          <button
            onClick={() => handleFineStep(+1)}
            className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
          >
            +1 Гц
          </button>
          <button
            onClick={() => handleFineStep(+10)}
            className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
          >
            +10 Гц
          </button>
          <button
            onClick={() => handleFineStep(+100)}
            className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
          >
            +100 Гц
          </button>
        </div>
      </div>
    </div>
  );
};
