import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, SessionRecord, CRChannel } from '../types/tinnitus';
import { audioEngine, ToneEvent } from '../audio/AudioEngine';
import { calculateCRChannels } from '../audio/crCalculator';

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'default-profile',
  name: 'Мой профиль',
  targetFrequency: 6500,
  earSide: 'both',
  thresholdVolume: 0.15,
  therapeuticVolume: 0.45,
  balance: 0,
  crCycleSpeedHz: 1.5,
  tonesPerCycle: 4,
  onCycles: 3,
  offCycles: 2,
  noiseType: 'none',
  noiseVolume: 0.2,
  waveform: 'sine',
  isCalibrated: false,
  createdAt: new Date().toISOString(),
  calibrationHistory: [],
  riHistory: [],
};

export function useAudioPlayer(profile: UserProfile, onSessionFinished?: (record: Partial<SessionRecord>) => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [currentDurationTarget, setCurrentDurationTarget] = useState(1800); // 30 mins
  const [currentChannelIndex, setCurrentChannelIndex] = useState<number | null>(null);
  const [activeCycle, setActiveCycle] = useState<number>(0);
  const [isSilenceCycle, setIsSilenceCycle] = useState<boolean>(false);
  const [channels, setChannels] = useState<CRChannel[]>(() => calculateCRChannels(profile.targetFrequency));

  const sessionStartTimestamp = useRef<string | null>(null);

  // Update channels whenever targetFrequency changes
  useEffect(() => {
    setChannels(calculateCRChannels(profile.targetFrequency));
  }, [profile.targetFrequency]);

  // Sync volume / noise changes dynamically if active
  useEffect(() => {
    if (isPlaying) {
      audioEngine.setMasterVolume(profile.therapeuticVolume);
      audioEngine.setEarSide(profile.earSide);
      audioEngine.setNoise(profile.noiseType, profile.noiseVolume);
    }
  }, [profile.therapeuticVolume, profile.earSide, profile.noiseType, profile.noiseVolume, isPlaying]);

  const handleToneTrigger = useCallback((event: ToneEvent) => {
    setCurrentChannelIndex(event.channelIndex);
    // Clear active highlight after tone finishes
    setTimeout(() => {
      setCurrentChannelIndex((curr) => (curr === event.channelIndex ? null : curr));
    }, event.duration * 1000);
  }, []);

  const handleCycleChange = useCallback((cycleIndex: number, silence: boolean) => {
    setActiveCycle(cycleIndex);
    setIsSilenceCycle(silence);
  }, []);

  const handleTick = useCallback((elapsed: number, remaining: number) => {
    setElapsedSeconds(elapsed);
    setRemainingSeconds(remaining);
  }, []);

  const handleStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleSessionComplete = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChannelIndex(null);

    const completedSeconds = audioEngine.getElapsedSeconds();
    if (onSessionFinished && sessionStartTimestamp.current) {
      onSessionFinished({
        timestamp: sessionStartTimestamp.current,
        durationSeconds: completedSeconds,
        targetFrequency: profile.targetFrequency,
      });
    }
    sessionStartTimestamp.current = null;
  }, [onSessionFinished, profile.targetFrequency]);

  useEffect(() => {
    audioEngine.setCallbacks({
      onToneTrigger: handleToneTrigger,
      onCycleChange: handleCycleChange,
      onTick: handleTick,
      onStateChange: handleStateChange,
      onSessionComplete: handleSessionComplete,
    });
  }, [handleToneTrigger, handleCycleChange, handleTick, handleStateChange, handleSessionComplete]);

  const startTherapy = useCallback((durationSeconds: number = 1800) => {
    setCurrentDurationTarget(durationSeconds);
    sessionStartTimestamp.current = new Date().toISOString();
    setElapsedSeconds(0);
    setRemainingSeconds(durationSeconds);
    audioEngine.startTherapy(profile, durationSeconds);
    setIsPlaying(true);
    setIsPaused(false);
  }, [profile]);

  const pauseTherapy = useCallback(() => {
    audioEngine.pauseTherapy();
    setIsPaused(true);
  }, []);

  const resumeTherapy = useCallback(() => {
    audioEngine.resumeTherapy();
    setIsPaused(false);
  }, []);

  const stopTherapy = useCallback(() => {
    const elapsed = audioEngine.getElapsedSeconds();
    audioEngine.stopTherapy();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChannelIndex(null);

    if (elapsed >= 30 && onSessionFinished && sessionStartTimestamp.current) {
      onSessionFinished({
        timestamp: sessionStartTimestamp.current,
        durationSeconds: elapsed,
        targetFrequency: profile.targetFrequency,
      });
    }
    sessionStartTimestamp.current = null;
    setElapsedSeconds(0);
  }, [onSessionFinished, profile.targetFrequency]);

  return {
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
  };
}
