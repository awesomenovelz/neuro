import React, { useState } from 'react';
import { UserProfile, EarSide, CalibrationRecord, ToneWaveform } from '../../types/tinnitus';
import { PitchMatcher } from './PitchMatcher';
import { LoudnessMatcher } from './LoudnessMatcher';
import { calculateCRChannels } from '../../audio/crCalculator';
import { audioEngine } from '../../audio/AudioEngine';
import { X, ArrowRight, ArrowLeft, Zap, Sparkles, CheckCircle2, Play, Square, Timer } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onStartTherapyImmediately?: () => void;
  onOpenRITest?: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onStartTherapyImmediately,
  onOpenRITest,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [frequency, setFrequency] = useState<number>(profile.targetFrequency || 6500);
  const [earSide, setEarSide] = useState<EarSide>(profile.earSide || 'both');
  const [thresholdVolume, setThresholdVolume] = useState<number>(profile.thresholdVolume || 0.15);
  const [therapeuticVolume, setTherapeuticVolume] = useState<number>(profile.therapeuticVolume || 0.45);
  const [waveform, setWaveform] = useState<ToneWaveform>(profile.waveform || 'sine');
  const [isPreviewingCR, setIsPreviewingCR] = useState(false);

  if (!isOpen) return null;

  const channels = calculateCRChannels(frequency);

  const handleNext = () => {
    audioEngine.stopCalibrationTone();
    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    audioEngine.stopCalibrationTone();
    if (isPreviewingCR) {
      audioEngine.stopTherapy();
      setIsPreviewingCR(false);
    }
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3);
    }
  };

  const togglePreviewCR = () => {
    if (isPreviewingCR) {
      audioEngine.stopTherapy();
      setIsPreviewingCR(false);
    } else {
      const tempProfile: UserProfile = {
        ...profile,
        targetFrequency: frequency,
        earSide,
        thresholdVolume,
        therapeuticVolume,
        isCalibrated: true,
      };
      audioEngine.startTherapy(tempProfile, 60); // 1 minute preview
      setIsPreviewingCR(true);
    }
  };

  const handleSave = (startNow: boolean = false) => {
    audioEngine.stopCalibrationTone();
    if (isPreviewingCR) {
      audioEngine.stopTherapy();
      setIsPreviewingCR(false);
    }

    const newCalibRecord: CalibrationRecord = {
      id: `calib-${Date.now()}`,
      timestamp: new Date().toISOString(),
      frequency,
      earSide,
      thresholdVolume,
      therapeuticVolume,
    };

    const prevHistory = profile.calibrationHistory || [];
    const updatedProfile: UserProfile = {
      ...profile,
      targetFrequency: frequency,
      earSide,
      thresholdVolume,
      therapeuticVolume,
      waveform,
      isCalibrated: true,
      lastCalibratedAt: new Date().toISOString(),
      calibrationHistory: [...prevHistory, newCalibRecord],
    };

    onSaveProfile(updatedProfile);
    onClose();

    if (startNow && onStartTherapyImmediately) {
      onStartTherapyImmediately();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neuro-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neuro-900 border border-neuro-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header with Steps */}
        <div className="p-6 border-b border-neuro-800/80 bg-neuro-850/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                Мастер калибровки частоты тиннитуса
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Определение тонального профиля для генерации 4 частот десинхронизации
              </p>
            </div>
            <button
              onClick={() => {
                audioEngine.stopCalibrationTone();
                if (isPreviewingCR) audioEngine.stopTherapy();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-neuro-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div
              className={`p-2 rounded-xl text-center border font-medium transition-all ${
                step === 1
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm'
                  : step > 1
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-neuro-900/50 border-neuro-800 text-slate-500'
              }`}
            >
              <span className="block font-mono text-[10px] uppercase opacity-75">Шаг 1</span>
              <span>Частота (Pitch)</span>
            </div>

            <div
              className={`p-2 rounded-xl text-center border font-medium transition-all ${
                step === 2
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm'
                  : step > 2
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-neuro-900/50 border-neuro-800 text-slate-500'
              }`}
            >
              <span className="block font-mono text-[10px] uppercase opacity-75">Шаг 2</span>
              <span>Громкость & Ухо</span>
            </div>

            <div
              className={`p-2 rounded-xl text-center border font-medium transition-all ${
                step === 3
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm'
                  : 'bg-neuro-900/50 border-neuro-800 text-slate-500'
              }`}
            >
              <span className="block font-mono text-[10px] uppercase opacity-75">Шаг 3</span>
              <span>Сетка CR частот</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 && (
            <PitchMatcher
              frequency={frequency}
              onFrequencyChange={setFrequency}
              volume={therapeuticVolume}
              waveform={waveform}
              onWaveformChange={setWaveform}
            />
          )}

          {step === 2 && (
            <LoudnessMatcher
              frequency={frequency}
              earSide={earSide}
              onEarSideChange={setEarSide}
              thresholdVolume={thresholdVolume}
              onThresholdVolumeChange={setThresholdVolume}
              therapeuticVolume={therapeuticVolume}
              onTherapeuticVolumeChange={setTherapeuticVolume}
            />
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="block text-emerald-200">Калибровка успешно завершена!</strong>
                  Математическая модель рассчитала 4 стимулирующие частоты на основе вашей целевой частоты {frequency} Гц.
                </div>
              </div>

              {/* 4 CR Frequency Grid Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                    Терапевтические частоты стимуляции (CR Channels)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    f_T = <strong className="text-amber-300">{frequency} Гц</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {channels.map((ch) => (
                    <div
                      key={ch.label}
                      className="p-3.5 rounded-2xl bg-neuro-850 border border-neuro-800 flex flex-col items-center justify-center text-center space-y-1 relative overflow-hidden"
                      style={{ borderColor: `${ch.color}40` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full mb-1"
                        style={{ backgroundColor: ch.color, boxShadow: `0 0 10px ${ch.color}` }}
                      />
                      <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                        {ch.label} ({ch.ratio < 1 ? `-${Math.round((1 - ch.ratio) * 100)}%` : `+${Math.round((ch.ratio - 1) * 100)}%`})
                      </span>
                      <span className="text-lg font-mono font-extrabold text-slate-100">
                        {ch.frequency} <span className="text-xs font-normal text-slate-400">Гц</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol Summary Card */}
              <div className="p-4 rounded-2xl bg-neuro-850 border border-neuro-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Сторона</span>
                  <span className="text-slate-200 font-medium">
                    {earSide === 'left' ? 'Левое ухо' : earSide === 'right' ? 'Правое ухо' : 'Оба уха'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Громкость SL</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    {Math.round(therapeuticVolume * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Паттерн</span>
                  <span className="text-sky-300 font-mono font-bold">3:2 ON/OFF</span>
                </div>
              </div>

              {/* Test Audio Preview */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neuro-900 border border-neuro-800">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold block text-slate-200">Прослушать тестовый цикл CR:</span>
                  <span className="text-slate-400">4 тона в случайном порядке с паузой десинхронизации</span>
                </div>
                <button
                  onClick={togglePreviewCR}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isPreviewingCR
                      ? 'bg-amber-500 text-neuro-950 shadow-md shadow-amber-500/20'
                      : 'bg-neuro-800 hover:bg-neuro-750 text-slate-200 border border-neuro-700'
                  }`}
                >
                  {isPreviewingCR ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Стоп</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
                      <span>Тест 3:2</span>
                    </>
                  )}
                </button>
              </div>

              {/* Residual Inhibition Quick Test Trigger */}
              {onOpenRITest && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-teal-500/10 border border-sky-500/20">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold block text-sky-200 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-sky-400" />
                      Тест остаточного торможения (RI Test):
                    </span>
                    <span className="text-slate-400">
                      60-секундная проверка затихания звона для подтверждения частоты {frequency} Гц
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      audioEngine.stopCalibrationTone();
                      if (isPreviewingCR) {
                        audioEngine.stopTherapy();
                        setIsPreviewingCR(false);
                      }
                      onOpenRITest();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all shrink-0 ml-2"
                  >
                    Пройти RI тест
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-neuro-800/80 bg-neuro-850/50 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neuro-800 hover:bg-neuro-750 text-slate-300 text-xs font-medium border border-neuro-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
            >
              <span>Далее</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-2.5 rounded-xl bg-neuro-800 hover:bg-neuro-750 text-slate-200 text-xs font-semibold border border-neuro-700 transition-all"
              >
                Сохранить
              </button>
              <button
                onClick={() => handleSave(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Сохранить и начать терапию</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
