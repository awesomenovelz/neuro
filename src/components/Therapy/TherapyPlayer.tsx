import React, { useState } from 'react';
import { UserProfile, CRChannel } from '../../types/tinnitus';
import { NeuroVisualizer } from './NeuroVisualizer';
import { SoundMaskMixer } from './SoundMaskMixer';
import { BreathingPacer } from './BreathingPacer';
import { audioEngine } from '../../audio/AudioEngine';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Clock,
  Gauge,
  Sliders,
  Sparkles,
  VolumeX,
  Timer,
} from 'lucide-react';

interface TherapyPlayerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  currentDurationTarget: number;
  currentChannelIndex: number | null;
  activeCycle: number;
  isSilenceCycle: boolean;
  channels: CRChannel[];
  onStart: (durationSec: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpenCalibration: () => void;
  onOpenVASModal: () => void;
  onOpenRITest?: () => void;
}

const TIMER_PRESETS = [
  { label: '15 мин', seconds: 15 * 60 },
  { label: '30 мин', seconds: 30 * 60 },
  { label: '45 мин', seconds: 45 * 60 },
  { label: '60 мин', seconds: 60 * 60 },
  { label: '120 мин', seconds: 120 * 60 },
  { label: 'Без таймера', seconds: 0 },
];

export const TherapyPlayer: React.FC<TherapyPlayerProps> = ({
  profile,
  onUpdateProfile,
  isPlaying,
  isPaused,
  elapsedSeconds,
  remainingSeconds,
  currentChannelIndex,
  activeCycle,
  isSilenceCycle,
  channels,
  onStart,
  onPause,
  onResume,
  onStop,
  onOpenCalibration,
  onOpenVASModal,
  onOpenRITest,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(30 * 60);
  const [testingChannelIdx, setTestingChannelIdx] = useState<number | null>(null);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 360);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingS = secs % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${remainingS.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${remainingS.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    onStart(selectedDuration);
  };

  const handleSoloTestTone = (idx: number, freq: number) => {
    if (testingChannelIdx === idx) {
      audioEngine.stopCalibrationTone();
      setTestingChannelIdx(null);
    } else {
      audioEngine.startCalibrationTone(freq, profile.therapeuticVolume);
      setTestingChannelIdx(idx);
    }
  };

  const handleSpeedChange = (val: number) => {
    onUpdateProfile({
      ...profile,
      crCycleSpeedHz: val,
    });
  };

  const handleVolumeChange = (val: number) => {
    onUpdateProfile({
      ...profile,
      therapeuticVolume: val,
    });
  };

  const handleNoiseTypeChange = (type: 'none' | 'pink' | 'ocean' | 'brown') => {
    onUpdateProfile({
      ...profile,
      noiseType: type,
    });
  };

  const handleNoiseVolumeChange = (vol: number) => {
    onUpdateProfile({
      ...profile,
      noiseVolume: vol,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Calibration Alert if not calibrated */}
      {!profile.isCalibrated && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-200 block">
                Рекомендуется пройти калибровку перед началом терапии
              </span>
              <span className="text-slate-300">
                Определите точную частоту тиннитуса для максимального терапевтического эффекта десинхронизации.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenCalibration}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neuro-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            Пройти калибровку
          </button>
        </div>
      )}

      {/* Main Grid: Left side (NeuroVisualizer & Controls) + Right side (Channels & Settings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visualizer & Session Engine (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* NeuroVisualizer 60 FPS */}
          <NeuroVisualizer
            channels={channels}
            activeChannelIndex={currentChannelIndex}
            activeCycle={activeCycle}
            isSilenceCycle={isSilenceCycle}
            isPlaying={isPlaying}
            isPaused={isPaused}
            targetFrequency={profile.targetFrequency}
          />

          {/* Primary Controls Card */}
          <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 shadow-xl space-y-6">
            {/* Session Timer Presets (if not playing) */}
            {!isPlaying ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Длительность сессии
                  </span>
                  <span>Стандарт: 30–60 минут</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TIMER_PRESETS.map((preset) => (
                    <button
                      key={preset.seconds}
                      onClick={() => setSelectedDuration(preset.seconds)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                        selectedDuration === preset.seconds
                          ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Live Timer Countdown & Progress */
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neuro-850 border border-neuro-800">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                    {selectedDuration > 0 ? 'Осталось времени' : 'Прошло времени'}
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-slate-100">
                    {selectedDuration > 0 ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
                  </span>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                    Пройдено
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>
            )}

            {/* Big Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isPlaying ? (
                <button
                  onClick={handleStartSession}
                  className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-bold text-base shadow-xl shadow-sky-500/25 transition-all transform active:scale-98"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>Начать сессию терапии</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={onResume}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Продолжить</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neuro-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Пауза</span>
                    </button>
                  )}

                  <button
                    onClick={onStop}
                    className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-sm border border-rose-500/30 transition-all"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>Завершить</span>
                  </button>
                </>
              )}
            </div>

            {/* Quick Actions: VAS & RI Test */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neuro-800/80 text-xs">
              <span className="text-slate-400">Клинические экспресс-тесты:</span>
              <div className="flex items-center gap-2">
                {onOpenRITest && (
                  <button
                    onClick={onOpenRITest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neuro-850 hover:bg-neuro-800 text-teal-300 font-medium border border-teal-500/30 transition-all"
                    title="Запустить 60-секундный тест остаточного торможения"
                  >
                    <Timer className="w-3.5 h-3.5 text-teal-400" />
                    <span>RI Тест (60с)</span>
                  </button>
                )}
                <button
                  onClick={onOpenVASModal}
                  className="px-3 py-1.5 rounded-xl bg-neuro-850 hover:bg-neuro-800 text-sky-400 font-medium border border-neuro-750 transition-all"
                >
                  Дневник VAS (0–10)
                </button>
              </div>
            </div>
          </div>

          {/* Resonance Breathing Guide (Vagus Pacer) */}
          <BreathingPacer
            isActive={isBreathingActive}
            onToggle={() => setIsBreathingActive(!isBreathingActive)}
          />
        </div>

        {/* Right Column: 4 CR Channels, Audio Parameters, Noise Mask (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 4 Stimulation Channels Card */}
          <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-200 tracking-wider block">
                  Терапевтические каналы стимуляции
                </span>
                <span className="text-[11px] text-slate-400">
                  Целевая частота $f_T$: <strong className="text-amber-300 font-mono">{profile.targetFrequency} Гц</strong>
                </span>
              </div>
              <button
                onClick={onOpenCalibration}
                className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-neuro-800 rounded-lg transition-all"
                title="Перекалибровать"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {/* Channel Cards */}
            <div className="grid grid-cols-2 gap-3">
              {channels.map((ch, idx) => {
                const isActive = currentChannelIndex === idx;
                const isSoloTesting = testingChannelIdx === idx;

                return (
                  <div
                    key={ch.label}
                    className={`p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isActive
                        ? 'bg-neuro-800 border-sky-400 shadow-lg scale-102'
                        : 'bg-neuro-850 border-neuro-800/80 hover:border-neuro-700'
                    }`}
                    style={{
                      borderColor: isActive ? ch.color : undefined,
                      boxShadow: isActive ? `0 0 15px ${ch.color}44` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ch.color, boxShadow: `0 0 6px ${ch.color}` }}
                        />
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {ch.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSoloTestTone(idx, ch.frequency)}
                        disabled={isPlaying}
                        className={`p-1 rounded-md text-[10px] font-mono transition-all ${
                          isSoloTesting
                            ? 'bg-amber-500 text-neuro-950'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-neuro-800'
                        } disabled:opacity-30`}
                        title="Прослушать тон соло"
                      >
                        {isSoloTesting ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-extrabold font-mono text-slate-100">
                        {ch.frequency} <span className="text-[10px] font-normal text-slate-400">Гц</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {ch.ratio < 1 ? `-${Math.round((1 - ch.ratio) * 100)}%` : `+${Math.round((ch.ratio - 1) * 100)}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Parameters: Volume & Rhythm Speed */}
          <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
            <span className="text-xs uppercase font-bold text-slate-200 tracking-wider block">
              Настройки стимуляции
            </span>

            {/* Volume / Sensation Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Громкость стимуляции (SL)
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {Math.round(profile.therapeuticVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.01"
                value={profile.therapeuticVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Tempo / Cycle Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  Ритм CR стимуляции
                </span>
                <span className="font-mono font-bold text-sky-400">
                  {profile.crCycleSpeedHz} Гц (~{Math.round(1000 / profile.crCycleSpeedHz)} мс/цикл)
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.1"
                value={profile.crCycleSpeedHz}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>

          {/* Background Mask Mixer */}
          <SoundMaskMixer
            noiseType={profile.noiseType}
            onNoiseTypeChange={handleNoiseTypeChange}
            noiseVolume={profile.noiseVolume}
            onNoiseVolumeChange={handleNoiseVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};
