import React from 'react';
import { Activity, Headphones, Calendar, BookOpen, Sliders, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import { UserProfile } from '../types/tinnitus';

interface HeaderProps {
  activeTab: 'therapy' | 'calibration' | 'journal' | 'guide';
  setActiveTab: (tab: 'therapy' | 'calibration' | 'journal' | 'guide') => void;
  profile: UserProfile;
  isPlaying: boolean;
  onOpenCalibration: () => void;
  onOpenRITest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  isPlaying,
  onOpenCalibration,
  onOpenRITest,
}) => {
  const lastCalibDate = profile.lastCalibratedAt ? new Date(profile.lastCalibratedAt) : new Date(profile.createdAt);
  const daysSinceCalib = Math.max(0, Math.floor((Date.now() - lastCalibDate.getTime()) / (1000 * 60 * 60 * 24)));
  const needsRecalibration = profile.isCalibrated && daysSinceCalib >= 7;
  return (
    <header className="sticky top-0 z-40 bg-neuro-950/80 backdrop-blur-xl border-b border-neuro-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 via-emerald-500/20 to-purple-500/20 border border-sky-500/30 shadow-lg shadow-sky-500/10">
            <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-emerald-300 to-purple-400 bg-clip-text text-transparent">
                NeuroReset
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                CR Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Акустическая нейромодуляция тиннитуса
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-neuro-900/90 p-1 rounded-xl border border-neuro-800 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('therapy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'therapy'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neuro-800/50'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Терапия</span>
          </button>

          <button
            onClick={() => setActiveTab('calibration')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'calibration'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neuro-800/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Калибровка</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'journal'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neuro-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Дневник</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neuro-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Руководство</span>
          </button>
        </nav>

        {/* Quick Calibration / Frequency Badge & RI Button */}
        <div className="flex items-center gap-2">
          {onOpenRITest && (
            <button
              onClick={onOpenRITest}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all"
              title="Экспресс-тест остаточного торможения (60 сек)"
            >
              <Timer className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">RI Тест</span>
            </button>
          )}

          {profile.isCalibrated ? (
            <button
              onClick={onOpenCalibration}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all group ${
                needsRecalibration
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 hover:border-amber-400'
                  : 'bg-neuro-900 border-emerald-500/30 hover:border-emerald-400/60 text-slate-200'
              }`}
              title={needsRecalibration ? `Прошло ${daysSinceCalib} дн. с последней калибровки. Нажмите для проверки!` : 'Нажмите для повторной калибровки частоты'}
            >
              {needsRecalibration ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <div className="text-left hidden md:block">
                <span className="text-slate-400 text-[10px] block leading-none">
                  {needsRecalibration ? 'Проверьте f_T' : 'Частота f_T'}
                </span>
                <span className={`font-mono font-semibold ${needsRecalibration ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {profile.targetFrequency} Гц
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenCalibration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-all animate-pulse"
            >
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Требуется калибровка</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
