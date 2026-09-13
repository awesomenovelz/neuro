import React, { useState, useEffect, useRef } from 'react';
import { ResidualInhibitionResult, RIResponse } from '../../types/tinnitus';
import { audioEngine } from '../../audio/AudioEngine';
import { X, Timer, CheckCircle2, Play, Sparkles, HelpCircle } from 'lucide-react';

interface ResidualInhibitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  frequency: number;
  therapeuticVolume: number;
  onSaveResult: (result: ResidualInhibitionResult) => void;
}

type TestPhase = 'intro' | 'stimulating' | 'evaluating' | 'timing_relief' | 'completed';

export const ResidualInhibitionModal: React.FC<ResidualInhibitionModalProps> = ({
  isOpen,
  onClose,
  frequency,
  therapeuticVolume,
  onSaveResult,
}) => {
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [stimulusType, setStimulusType] = useState<'narrowband' | 'tone'>('narrowband');
  const [countdown, setCountdown] = useState<number>(60);
  const [reliefSeconds, setReliefSeconds] = useState<number>(0);
  const [selectedResponse, setSelectedResponse] = useState<RIResponse | null>(null);

  const countdownTimerRef = useRef<number | null>(null);
  const reliefTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      audioEngine.stopRIStimulus();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (reliefTimerRef.current) clearInterval(reliefTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const startTest = () => {
    setCountdown(60);
    setPhase('stimulating');
    audioEngine.startRIStimulus(frequency, therapeuticVolume, stimulusType);

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          audioEngine.stopRIStimulus();
          setPhase('evaluating');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelTest = () => {
    audioEngine.stopRIStimulus();
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (reliefTimerRef.current) clearInterval(reliefTimerRef.current);
    setPhase('intro');
  };

  const handleSelectResponse = (resp: RIResponse) => {
    setSelectedResponse(resp);
    if (resp === 'complete' || resp === 'partial') {
      // Start relief duration stopwatch
      setReliefSeconds(0);
      setPhase('timing_relief');
      reliefTimerRef.current = window.setInterval(() => {
        setReliefSeconds((s) => s + 1);
      }, 1000);
    } else {
      // Completed without relief duration
      saveAndFinish(resp, 0);
    }
  };

  const finishTimingRelief = () => {
    if (reliefTimerRef.current) clearInterval(reliefTimerRef.current);
    if (selectedResponse) {
      saveAndFinish(selectedResponse, reliefSeconds);
    }
  };

  const saveAndFinish = (resp: RIResponse, durationSec: number) => {
    const result: ResidualInhibitionResult = {
      id: `ri-${Date.now()}`,
      timestamp: new Date().toISOString(),
      frequency,
      stimulusDurationSeconds: 60,
      response: resp,
      inhibitionDurationSeconds: durationSec > 0 ? durationSec : undefined,
    };

    onSaveResult(result);
    setPhase('completed');
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neuro-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neuro-900 border border-neuro-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-neuro-800 bg-neuro-850/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Тест остаточного торможения (RI Test)</h3>
              <p className="text-xs text-slate-400">Проверка попадания в частоту и пластичности слуховой коры</p>
            </div>
          </div>
          <button
            onClick={() => {
              cancelTest();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-neuro-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {phase === 'intro' && (
            <div className="space-y-6">
              {/* Scientific explanation */}
              <div className="p-4 rounded-2xl bg-neuro-850 border border-neuro-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>Что такое остаточное торможение (Residual Inhibition)?</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Это клинический феномен, открытый д-ром Верноном: при 60-секундном прослушивании звука, точно совпадающего с частотой тиннитуса, патологические нейроны временно истощаются, и в ушах наступает <strong>частичное или полное затихание звона</strong> на время от 30 секунд до нескольких минут.
                </p>
                <p className="text-emerald-400 font-medium pt-1">
                  ✓ Положительный ответ подтверждает, что частота {frequency} Гц выбрана правильно!
                </p>
              </div>

              {/* Stimulus settings */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Тип тестирующего звука:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStimulusType('narrowband')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      stimulusType === 'narrowband'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
                    }`}
                  >
                    <div className="font-bold">Узкополосный шум (Рекомендовано)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Мягкий фокус вокруг {frequency} Гц</div>
                  </button>

                  <button
                    onClick={() => setStimulusType('tone')}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      stimulusType === 'tone'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
                    }`}
                  >
                    <div className="font-bold">Модулированный тон</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Чистый тон с микро-вибрато</div>
                  </button>
                </div>
              </div>

              {/* Status info */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neuro-850 border border-neuro-800 text-xs">
                <span className="text-slate-400">
                  Тестовая частота: <strong className="text-slate-200 font-mono">{frequency} Гц</strong>
                </span>
                <span className="text-slate-400">
                  Длительность: <strong className="text-slate-200 font-mono">60 секунд</strong>
                </span>
              </div>

              {/* Start Button */}
              <button
                onClick={startTest}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Запустить 60-секундный тест RI</span>
              </button>
            </div>
          )}

          {phase === 'stimulating' && (
            <div className="text-center py-6 space-y-6">
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                {/* Circular timer progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#172030"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#38bdf8"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - countdown / 60)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold font-mono text-slate-100">{countdown}</span>
                  <span className="text-xs text-slate-400 font-mono">секунд</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-bold text-sky-300 block animate-pulse">
                  Идет звуковая стимуляция ({frequency} Гц)...
                </span>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Слушайте звук спокойно в наушниках. Ровно через 60 секунд звук выключится сам.
                </p>
              </div>

              <button
                onClick={cancelTest}
                className="px-5 py-2 rounded-xl bg-neuro-850 hover:bg-neuro-800 text-rose-300 text-xs font-semibold border border-neuro-750 transition-all"
              >
                Прервать тест
              </button>
            </div>
          )}

          {phase === 'evaluating' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <span className="text-xs uppercase font-mono text-emerald-400 font-bold tracking-wider">
                  Звук остановлен
                </span>
                <h4 className="text-lg font-bold text-slate-100">
                  Что произошло с вашим тиннитусом прямо сейчас?
                </h4>
                <p className="text-xs text-slate-400">
                  Сравните интенсивность звона в ушах в эту секунду с уровнем до теста.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelectResponse('complete')}
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Полное затихание</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Шум полностью исчез или наступила кратковременная тишина
                  </p>
                </button>

                <button
                  onClick={() => handleSelectResponse('partial')}
                  className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-500/20 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Заметное ослабление</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Звон стал тише, мягче или отодвинулся на дальний план
                  </p>
                </button>

                <button
                  onClick={() => handleSelectResponse('unchanged')}
                  className="p-4 rounded-2xl bg-neuro-850 border border-neuro-800 hover:border-neuro-700 text-left transition-all"
                >
                  <div className="text-slate-300 font-bold text-sm">Без изменений</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Громкость и характер тиннитуса остались прежними
                  </p>
                </button>

                <button
                  onClick={() => handleSelectResponse('worse')}
                  className="p-4 rounded-2xl bg-neuro-850 border border-neuro-800 hover:border-neuro-700 text-left transition-all"
                >
                  <div className="text-slate-300 font-bold text-sm">Кратковременно усилился</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Шум временно кажется чуть более резким
                  </p>
                </button>
              </div>
            </div>
          )}

          {phase === 'timing_relief' && (
            <div className="text-center py-6 space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 max-w-md mx-auto">
                <strong>Отличный результат!</strong> Зафиксировано остаточное торможение (RI).
                Секундомер ниже замеряет, сколько продлится облегчение.
              </div>

              <div className="space-y-1">
                <span className="text-[11px] uppercase font-mono text-slate-400">
                  Время затихания тиннитуса
                </span>
                <div className="text-5xl font-extrabold font-mono text-emerald-400">
                  {formatSecs(reliefSeconds)}
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Когда звон постепенно вернётся к своей обычной громкости, нажмите кнопку ниже:
              </p>

              <button
                onClick={finishTimingRelief}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                Шум вернулся к обычному уровню
              </button>
            </div>
          )}

          {phase === 'completed' && (
            <div className="text-center py-8 space-y-5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-100">Результат теста сохранен</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Данные занесены в историю вашего профиля. Результаты помогут отслеживать динамику чувствительности слуховой коры к терапии.
                </p>
              </div>

              <button
                onClick={() => {
                  setPhase('intro');
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-neuro-800 hover:bg-neuro-750 text-slate-200 text-xs font-bold border border-neuro-700 transition-all"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
