import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle, Activity, Waves } from 'lucide-react';
import { ToneWaveform } from '../../types/tinnitus';
import { audioEngine } from '../../audio/AudioEngine';

interface PitchMatcherProps {
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  volume: number;
  waveform?: ToneWaveform;
  onWaveformChange?: (wf: ToneWaveform) => void;
}

type FrequencyBand = 'bass' | 'mid' | 'high';

const MIN_FREQ = 20;
const MAX_FREQ = 16000;

const BAND_PRESETS: Record<FrequencyBand, { label: string; presets: { label: string; value: number }[] }> = {
  bass: {
    label: 'Гул / Бас (20 – 500 Гц)',
    presets: [
      { label: '30 Гц', value: 30 },
      { label: '60 Гц', value: 60 },
      { label: '100 Гц', value: 100 },
      { label: '125 Гц', value: 125 },
      { label: '250 Гц', value: 250 },
      { label: '400 Гц', value: 400 },
    ],
  },
  mid: {
    label: 'Средние частоты (500 – 4000 Гц)',
    presets: [
      { label: '500 Гц', value: 500 },
      { label: '750 Гц', value: 750 },
      { label: '1 кГц', value: 1000 },
      { label: '1.5 кГц', value: 1500 },
      { label: '2 кГц', value: 2000 },
      { label: '3 кГц', value: 3000 },
    ],
  },
  high: {
    label: 'Высокий писк (4000 – 16000 Гц)',
    presets: [
      { label: '4 кГц', value: 4000 },
      { label: '6 кГц', value: 6000 },
      { label: '8 кГц', value: 8000 },
      { label: '10 кГц', value: 10000 },
      { label: '12 кГц', value: 12000 },
      { label: '14 кГц', value: 14000 },
    ],
  },
};

// Helper: Convert frequency to logarithmic slider position (0..1000)
function freqToLogPos(f: number): number {
  const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, f));
  return (Math.log(clamped / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ)) * 1000;
}

// Helper: Convert logarithmic slider position (0..1000) to frequency
function logPosToFreq(pos: number): number {
  const ratio = Math.max(0, Math.min(1000, pos)) / 1000;
  const f = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, ratio);
  if (f < 100) return Math.round(f);
  if (f < 1000) return Math.round(f / 5) * 5;
  return Math.round(f / 25) * 25;
}

export const PitchMatcher: React.FC<PitchMatcherProps> = ({
  frequency,
  onFrequencyChange,
  volume,
  waveform = 'sine',
  onWaveformChange,
}) => {
  const [isPlayingTone, setIsPlayingTone] = useState(false);
  const [inputStr, setInputStr] = useState(frequency.toString());

  // Determine active band from current frequency
  const currentBand: FrequencyBand =
    frequency < 500 ? 'bass' : frequency <= 4000 ? 'mid' : 'high';
  const [activeBandTab, setActiveBandTab] = useState<FrequencyBand>(currentBand);

  // Sync text input with external frequency updates
  useEffect(() => {
    setInputStr(frequency.toString());
  }, [frequency]);

  // Stop tone on unmount
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
      audioEngine.startCalibrationTone(frequency, volume, waveform);
      setIsPlayingTone(true);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = parseFloat(e.target.value);
    const newFreq = logPosToFreq(pos);
    onFrequencyChange(newFreq);
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(newFreq);
    }
  };

  const handleDirectInputCommit = () => {
    let parsed = parseInt(inputStr, 10);
    if (isNaN(parsed)) parsed = frequency;
    parsed = Math.max(MIN_FREQ, Math.min(MAX_FREQ, parsed));
    onFrequencyChange(parsed);
    setInputStr(parsed.toString());
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(parsed);
    }
  };

  const handleFineStep = (delta: number) => {
    const next = Math.max(MIN_FREQ, Math.min(MAX_FREQ, frequency + delta));
    onFrequencyChange(next);
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(next);
    }
  };

  const handleSelectPreset = (val: number) => {
    onFrequencyChange(val);
    if (isPlayingTone) {
      audioEngine.updateCalibrationFrequency(val);
    }
  };

  const handleSelectBandTab = (band: FrequencyBand) => {
    setActiveBandTab(band);
    // If current frequency is far outside the selected band, jump to band center
    if (band === 'bass' && frequency >= 500) {
      handleSelectPreset(100);
    } else if (band === 'mid' && (frequency < 500 || frequency > 4000)) {
      handleSelectPreset(1500);
    } else if (band === 'high' && frequency < 4000) {
      handleSelectPreset(6500);
    }
  };

  const handleWaveformToggle = (wf: ToneWaveform) => {
    onWaveformChange?.(wf);
    audioEngine.setCalibrationWaveform(wf as 'sine' | 'triangle');
  };

  return (
    <div className="space-y-6">
      {/* Explanation Banner */}
      <div className="p-4 rounded-xl bg-neuro-900 border border-neuro-800 text-sm text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sky-400">
          <HelpCircle className="w-4 h-4" />
          <span>Как определить частоту своего тиннитуса (20 – 16 000 Гц):</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          1. Наденьте наушники и нажмите кнопку <strong>«Слушать тестовый тон»</strong>.<br />
          2. Выберите нужный диапазон: <strong>«Гул/Бас»</strong> (при низкочастотной вибрации, Меньере), <strong>«Средние»</strong> или <strong>«Высокий писк»</strong>.<br />
          3. Плавно передвигайте логарифмический слайдер или используйте точную подстройку, пока тон не <strong>сольется с вашим звоном</strong>.
        </p>
      </div>

      {/* 3 Frequency Band Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleSelectBandTab('bass')}
          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
            activeBandTab === 'bass'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
              : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-850'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-amber-400" />
            <span>Гул / Бас</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-normal">20 – 500 Гц</span>
        </button>

        <button
          onClick={() => handleSelectBandTab('mid')}
          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
            activeBandTab === 'mid'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
              : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-850'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Средние</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-normal">500 – 4000 Гц</span>
        </button>

        <button
          onClick={() => handleSelectBandTab('high')}
          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
            activeBandTab === 'high'
              ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10'
              : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-850'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Высокий писк</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-normal">4000 – 16 000 Гц</span>
        </button>
      </div>

      {/* Main Pitch Display, Editable Input & Audio Toggle */}
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-neuro-900 to-neuro-850 border border-neuro-800 relative overflow-hidden">
        <div className="text-center space-y-2 z-10">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block">
            Целевая частота тиннитуса (f_T)
          </span>

          {/* Direct Numerical Input and Large Display */}
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              onBlur={handleDirectInputCommit}
              onKeyDown={(e) => e.key === 'Enter' && handleDirectInputCommit()}
              className="text-4xl sm:text-5xl font-extrabold font-mono text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 bg-transparent border-b-2 border-dashed border-sky-500/40 focus:border-sky-400 focus:outline-none max-w-[240px] px-1"
              title="Нажмите для прямого ввода точной частоты"
            />
            <span className="text-xl font-mono text-slate-400 font-semibold">Гц</span>
          </div>

          <span className="text-[11px] text-slate-500 block">
            {frequency < 100
              ? 'Сверхнизкий суб-бас (венозный шум / вибрация)'
              : frequency < 500
              ? 'Низкочастотный гул (гидропс / тубарный шум)'
              : frequency < 4000
              ? 'Среднечастотный тон'
              : 'Высокочастотный писк / звон'}
          </span>
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

      {/* Dynamic Octave Presets under selected band */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          Быстрые пресеты ({BAND_PRESETS[activeBandTab].label}):
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {BAND_PRESETS[activeBandTab].presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSelectPreset(preset.value)}
              className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                Math.abs(frequency - preset.value) < (preset.value < 100 ? 5 : 50)
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 border-sky-400'
                  : 'bg-neuro-900 text-slate-300 hover:bg-neuro-800 border-neuro-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logarithmic Frequency Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>20 Гц (Бас/Гул)</span>
          <span className="text-sky-400 font-bold">{frequency} Гц (Логарифм)</span>
          <span>16 000 Гц (Писк)</span>
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          step="1"
          value={freqToLogPos(frequency)}
          onChange={handleSliderChange}
          className="w-full h-2.5 bg-neuro-900 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
        />
      </div>

      {/* Adaptive Fine-Tuning Step Controls */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          Точная подстройка частоты
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {frequency < 500 ? (
            <>
              <button
                onClick={() => handleFineStep(-25)}
                className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
              >
                -25 Гц
              </button>
              <button
                onClick={() => handleFineStep(-5)}
                className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
              >
                -5 Гц
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
                onClick={() => handleFineStep(+5)}
                className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
              >
                +5 Гц
              </button>
              <button
                onClick={() => handleFineStep(+25)}
                className="px-3 py-1.5 rounded-lg bg-neuro-900 hover:bg-neuro-800 text-slate-300 font-mono text-xs border border-neuro-800 transition-all"
              >
                +25 Гц
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Waveform Selector Card */}
      <div className="p-4 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
            Форма волны звука:
          </span>
          {frequency < 200 && (
            <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
              Для баса &lt;200 Гц включена авто-компенсация громкости
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleWaveformToggle('sine')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              waveform === 'sine'
                ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span>Чистый синус (Sine)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Идеально чистый тон без обертонов. Стандарт для средних и высоких частот.
            </p>
          </button>

          <button
            onClick={() => handleWaveformToggle('triangle')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              waveform === 'triangle'
                ? 'bg-teal-500/20 border-teal-400 text-teal-200 shadow-sm'
                : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <span>Мягкий гармонический (Triangle)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Обогащен мягкими гармониками. <strong>Рекомендован для баса 20–150 Гц</strong>.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
