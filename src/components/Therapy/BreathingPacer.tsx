import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Square, Settings2 } from 'lucide-react';

interface BreathingPacerProps {
  isActive: boolean;
  onToggle: () => void;
}

type BreathingMode = 'vagus' | 'resonance';

interface PhaseConfig {
  name: 'inhale' | 'hold' | 'exhale' | 'rest';
  label: string;
  durationSec: number;
  color: string;
  glowColor: string;
}

const MODES: Record<BreathingMode, { title: string; description: string; phases: PhaseConfig[] }> = {
  vagus: {
    title: 'Вагусный покой (4-2-6)',
    description: 'Удлинённый выдох для максимальной активации блуждающего нерва и снижения гипервозбуждения слуховой коры',
    phases: [
      { name: 'inhale', label: 'Вдох носом', durationSec: 4, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)' },
      { name: 'hold', label: 'Мягкая пауза', durationSec: 2, color: '#a78bfa', glowColor: 'rgba(167, 139, 250, 0.4)' },
      { name: 'exhale', label: 'Медленный выдох ртом', durationSec: 6, color: '#34d399', glowColor: 'rgba(52, 211, 153, 0.4)' },
    ],
  },
  resonance: {
    title: 'Резонанс 6 BPM (5-5)',
    description: 'Оптимальная частота 0.1 Гц для синхронизации вариабельности ритма сердца (ВРС) и снятия стресса',
    phases: [
      { name: 'inhale', label: 'Глубокий вдох', durationSec: 5, color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)' },
      { name: 'exhale', label: 'Спокойный выдох', durationSec: 5, color: '#34d399', glowColor: 'rgba(52, 211, 153, 0.4)' },
    ],
  },
};

export const BreathingPacer: React.FC<BreathingPacerProps> = ({ isActive, onToggle }) => {
  const [mode, setMode] = useState<BreathingMode>('vagus');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0); // 0 to 1
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const animRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(Date.now());

  const currentConfig = MODES[mode];
  const currentPhase = currentConfig.phases[currentPhaseIndex];

  useEffect(() => {
    if (!isActive) {
      setCurrentPhaseIndex(0);
      setPhaseProgress(0);
      setCycleCount(0);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    phaseStartTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const elapsedSec = (now - phaseStartTimeRef.current) / 1000;
      const targetSec = currentPhase.durationSec;
      const progress = Math.min(1.0, elapsedSec / targetSec);

      setPhaseProgress(progress);

      if (progress >= 1.0) {
        // Move to next phase
        const nextIndex = (currentPhaseIndex + 1) % currentConfig.phases.length;
        if (nextIndex === 0) {
          setCycleCount((c) => c + 1);
        }
        setCurrentPhaseIndex(nextIndex);
        phaseStartTimeRef.current = Date.now();
      } else {
        animRef.current = requestAnimationFrame(loop);
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive, currentPhaseIndex, mode, currentPhase.durationSec, currentConfig.phases.length]);

  // Calculate visual scale of circle
  let circleScale = 0.65;
  if (isActive) {
    if (currentPhase.name === 'inhale') {
      circleScale = 0.65 + phaseProgress * 0.35; // 0.65 -> 1.0
    } else if (currentPhase.name === 'hold') {
      circleScale = 1.0;
    } else if (currentPhase.name === 'exhale') {
      circleScale = 1.0 - phaseProgress * 0.35; // 1.0 -> 0.65
    }
  }

  return (
    <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-200 tracking-wider">
              Резонансный дыхательный гид (Вагус)
            </h4>
            <p className="text-[11px] text-slate-400">
              Снижение активности лимбической системы и стрессового тонуса
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-neuro-800 rounded-lg transition-all"
            title="Выбрать режим дыхания"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-teal-500 hover:bg-teal-400 text-neuro-950 shadow-md shadow-teal-500/20'
                : 'bg-neuro-850 hover:bg-neuro-800 text-slate-300 border border-neuro-750'
            }`}
          >
            {isActive ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>Остановить</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-teal-400" />
                <span>Включить ритм</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Selector */}
      {showSettings && (
        <div className="p-3.5 rounded-2xl bg-neuro-850 border border-neuro-800 space-y-2 text-xs">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Режим дыхания:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(MODES) as BreathingMode[]).map((mKey) => (
              <button
                key={mKey}
                onClick={() => {
                  setMode(mKey);
                  setCurrentPhaseIndex(0);
                  setPhaseProgress(0);
                  phaseStartTimeRef.current = Date.now();
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  mode === mKey
                    ? 'bg-teal-500/15 border-teal-400 text-teal-300'
                    : 'bg-neuro-900 border-neuro-800 text-slate-400 hover:bg-neuro-800'
                }`}
              >
                <div className="font-semibold text-slate-200">{MODES[mKey].title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                  {MODES[mKey].description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Visual Breathing Aura */}
      {isActive ? (
        <div className="flex flex-col items-center justify-center py-6 relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Outer expanding ring */}
            <div
              className="absolute rounded-full transition-all ease-linear"
              style={{
                width: `${circleScale * 160}px`,
                height: `${circleScale * 160}px`,
                backgroundColor: `${currentPhase.color}15`,
                border: `2px solid ${currentPhase.color}`,
                boxShadow: `0 0 30px ${currentPhase.glowColor}`,
                transitionDuration: '100ms',
              }}
            />

            {/* Inner pulsating core */}
            <div
              className="relative z-10 w-24 h-24 rounded-full bg-neuro-950/90 border border-neuro-800 flex flex-col items-center justify-center text-center p-2 shadow-xl"
            >
              <span className="text-xs font-bold font-mono tracking-tight" style={{ color: currentPhase.color }}>
                {currentPhase.label}
              </span>
              <span className="text-lg font-extrabold font-mono text-slate-100">
                {Math.ceil(currentPhase.durationSec * (1 - phaseProgress))}s
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>
              Пройдено циклов: <strong className="text-slate-200 font-mono">{cycleCount}</strong>
            </span>
            <span>•</span>
            <span className="text-teal-300 font-medium">{currentConfig.title}</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-neuro-850/60 border border-dashed border-neuro-800 flex items-center justify-between text-xs text-slate-400">
          <span>Синхронизируйте дыхание с терапией для усиления эффекта LTD (нейропластичности).</span>
          <button
            onClick={onToggle}
            className="text-teal-400 hover:text-teal-300 font-semibold shrink-0 ml-2"
          >
            Запустить гид →
          </button>
        </div>
      )}
    </div>
  );
};
