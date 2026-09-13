import React, { useState, useCallback } from 'react';
import { UserProfile, SessionRecord, ResidualInhibitionResult, CalibrationRecord } from './types/tinnitus';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAudioPlayer, DEFAULT_USER_PROFILE } from './hooks/useAudioPlayer';
import { Header } from './components/Header';
import { TherapyPlayer } from './components/Therapy/TherapyPlayer';
import { CalibrationModal } from './components/Calibration/CalibrationModal';
import { ResidualInhibitionModal } from './components/Calibration/ResidualInhibitionModal';
import { VASRatingModal } from './components/Journal/VASRatingModal';
import { ProgressCharts } from './components/Journal/ProgressCharts';
import { HistoryList } from './components/Journal/HistoryList';
import { ProtocolGuide } from './components/Education/ProtocolGuide';
import { PitchMatcher } from './components/Calibration/PitchMatcher';
import { LoudnessMatcher } from './components/Calibration/LoudnessMatcher';
import { calculateCRChannels } from './audio/crCalculator';
import { Sliders, Activity, Timer, Check } from 'lucide-react';

export const App: React.FC = () => {
  const [profile, setProfile] = useLocalStorage<UserProfile>('neuroreset_user_profile', DEFAULT_USER_PROFILE);
  const [sessions, setSessions] = useLocalStorage<SessionRecord[]>('neuroreset_therapy_sessions', [
    // Pre-populate with realistic demo calibration point if fresh
    {
      id: 'demo-init-1',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      durationSeconds: 1800,
      targetFrequency: profile.targetFrequency,
      preVASLoudness: 7,
      postVASLoudness: 6,
      notes: 'Первая ознакомительная сессия, звук стал немного мягче',
    },
    {
      id: 'demo-init-2',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      durationSeconds: 2400,
      targetFrequency: profile.targetFrequency,
      preVASLoudness: 6,
      postVASLoudness: 5,
      notes: 'Вечерняя сессия 40 минут',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'therapy' | 'calibration' | 'journal' | 'guide'>('therapy');
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isVASOpen, setIsVASOpen] = useState(false);
  const [isRITestOpen, setIsRITestOpen] = useState(false);

  // Hook for session completion
  const handleSessionFinished = useCallback(
    (record: Partial<SessionRecord>) => {
      const newRecord: SessionRecord = {
        id: `session-${Date.now()}`,
        timestamp: record.timestamp || new Date().toISOString(),
        durationSeconds: record.durationSeconds || 0,
        targetFrequency: record.targetFrequency || profile.targetFrequency,
      };

      setSessions((prev) => [...prev, newRecord]);
      // Prompt user to record post-session VAS
      setIsVASOpen(true);
    },
    [profile.targetFrequency, setSessions]
  );

  const {
    isPlaying,
    isPaused,
    elapsedSeconds,
    remainingSeconds,
    currentDurationTarget,
    currentChannelIndex,
    activeCycle,
    isSilenceCycle,
    channels,
    startTherapy,
    pauseTherapy,
    resumeTherapy,
    stopTherapy,
  } = useAudioPlayer(profile, handleSessionFinished);

  const handleSaveRating = (data: { loudness: number; distress: number; notes?: string }) => {
    // If there is a recent session, attach rating to it; otherwise create a standalone log
    setSessions((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && Date.now() - new Date(copy[copy.length - 1].timestamp).getTime() < 30 * 60 * 1000) {
        copy[copy.length - 1].postVASLoudness = data.loudness;
        copy[copy.length - 1].postVASDistress = data.distress;
        if (data.notes) copy[copy.length - 1].notes = data.notes;
        return copy;
      }
      return [
        ...copy,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          durationSeconds: 0,
          targetFrequency: profile.targetFrequency,
          postVASLoudness: data.loudness,
          postVASDistress: data.distress,
          notes: data.notes,
        },
      ];
    });
  };

  const handleSaveRIResult = (result: ResidualInhibitionResult) => {
    setProfile((prev) => {
      const prevRI = prev.riHistory || [];
      return {
        ...prev,
        riHistory: [...prevRI, result],
      };
    });
  };

  const handleSaveManualCalibration = () => {
    const newRecord: CalibrationRecord = {
      id: `calib-${Date.now()}`,
      timestamp: new Date().toISOString(),
      frequency: profile.targetFrequency,
      earSide: profile.earSide,
      thresholdVolume: profile.thresholdVolume,
      therapeuticVolume: profile.therapeuticVolume,
    };

    setProfile((prev) => ({
      ...prev,
      isCalibrated: true,
      lastCalibratedAt: new Date().toISOString(),
      calibrationHistory: [...(prev.calibrationHistory || []), newRecord],
    }));
  };

  const handleClearHistory = () => {
    setSessions([]);
  };

  return (
    <div className="min-h-screen bg-neuro-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        isPlaying={isPlaying}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onOpenRITest={() => setIsRITestOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'therapy' && (
          <TherapyPlayer
            profile={profile}
            onUpdateProfile={setProfile}
            isPlaying={isPlaying}
            isPaused={isPaused}
            elapsedSeconds={elapsedSeconds}
            remainingSeconds={remainingSeconds}
            currentDurationTarget={currentDurationTarget}
            currentChannelIndex={currentChannelIndex}
            activeCycle={activeCycle}
            isSilenceCycle={isSilenceCycle}
            channels={channels}
            onStart={startTherapy}
            onPause={pauseTherapy}
            onResume={resumeTherapy}
            onStop={stopTherapy}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            onOpenVASModal={() => setIsVASOpen(true)}
            onOpenRITest={() => setIsRITestOpen(true)}
          />
        )}

        {activeTab === 'calibration' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-2">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-400" />
                Калибровка акустического профиля
              </h2>
              <p className="text-xs text-slate-400">
                Настройте частоту своего тиннитуса, сторону звучания и порог слышимости для генерации 4 индивидуальных частот Acoustic CR.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-6">
              <PitchMatcher
                frequency={profile.targetFrequency}
                onFrequencyChange={(freq) => setProfile({ ...profile, targetFrequency: freq, isCalibrated: true })}
                volume={profile.therapeuticVolume}
                waveform={profile.waveform || 'sine'}
                onWaveformChange={(wf) => setProfile({ ...profile, waveform: wf })}
              />

              <div className="pt-4 border-t border-neuro-800">
                <LoudnessMatcher
                  frequency={profile.targetFrequency}
                  earSide={profile.earSide}
                  onEarSideChange={(ear) => setProfile({ ...profile, earSide: ear })}
                  thresholdVolume={profile.thresholdVolume}
                  onThresholdVolumeChange={(vol) => setProfile({ ...profile, thresholdVolume: vol })}
                  therapeuticVolume={profile.therapeuticVolume}
                  onTherapeuticVolumeChange={(vol) => setProfile({ ...profile, therapeuticVolume: vol })}
                />
              </div>

              {/* Calculated Channels Preview & Actions */}
              <div className="pt-4 border-t border-neuro-800 space-y-4">
                <span className="text-xs uppercase font-bold text-slate-300 tracking-wider block">
                  Текущие рассчитанные терапевтические частоты (CR Channels):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {calculateCRChannels(profile.targetFrequency).map((ch) => (
                    <div
                      key={ch.label}
                      className="p-3 rounded-2xl bg-neuro-850 border border-neuro-800 text-center"
                      style={{ borderColor: `${ch.color}55` }}
                    >
                      <span className="text-xs font-mono font-bold block" style={{ color: ch.color }}>
                        {ch.label}
                      </span>
                      <span className="text-base font-extrabold font-mono text-slate-100">
                        {ch.frequency} <span className="text-xs font-normal text-slate-400">Гц</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neuro-800">
                  <button
                    onClick={() => setIsRITestOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all"
                  >
                    <Timer className="w-4 h-4 text-teal-400" />
                    <span>Пройти тест остаточного торможения (RI 60с)</span>
                  </button>

                  <button
                    onClick={handleSaveManualCalibration}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Сохранить в историю калибровок</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <ProgressCharts
              sessions={sessions}
              profile={profile}
              onOpenCalibration={() => setIsCalibrationOpen(true)}
              onOpenRITest={() => setIsRITestOpen(true)}
            />
            <HistoryList
              sessions={sessions}
              onClearHistory={handleClearHistory}
              onOpenVASModal={() => setIsVASOpen(true)}
            />
          </div>
        )}

        {activeTab === 'guide' && <ProtocolGuide />}
      </main>

      {/* Modals */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        profile={profile}
        onSaveProfile={(updated) => setProfile(updated)}
        onStartTherapyImmediately={() => {
          setActiveTab('therapy');
          startTherapy(1800);
        }}
        onOpenRITest={() => {
          setIsCalibrationOpen(false);
          setIsRITestOpen(true);
        }}
      />

      <ResidualInhibitionModal
        isOpen={isRITestOpen}
        onClose={() => setIsRITestOpen(false)}
        frequency={profile.targetFrequency}
        therapeuticVolume={profile.therapeuticVolume}
        onSaveResult={handleSaveRIResult}
      />

      <VASRatingModal
        isOpen={isVASOpen}
        onClose={() => setIsVASOpen(false)}
        onSaveRating={handleSaveRating}
      />

      {/* Footer */}
      <footer className="border-t border-neuro-800/80 bg-neuro-950/80 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-300">NeuroReset</span>
          <span>— Acoustic Coordinated Reset Neuromodulation Therapy</span>
        </div>
        <p className="max-w-xl mx-auto text-[11px] text-slate-600">
          Разработано на основе открытых научных публикаций профессора Петера Тасса (Jülich Research Center).
          Индивидуальные данные сохраняются исключительно локально на вашем устройстве.
        </p>
      </footer>
    </div>
  );
};
