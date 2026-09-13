import React, { useState } from 'react';
import { X, HeartHandshake, Check } from 'lucide-react';

interface VASRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRating: (data: {
    loudness: number;
    distress: number;
    notes?: string;
  }) => void;
  initialLoudness?: number;
  initialDistress?: number;
}

export const VASRatingModal: React.FC<VASRatingModalProps> = ({
  isOpen,
  onClose,
  onSaveRating,
  initialLoudness = 5,
  initialDistress = 4,
}) => {
  const [loudness, setLoudness] = useState<number>(initialLoudness);
  const [distress, setDistress] = useState<number>(initialDistress);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRating({
      loudness,
      distress,
      notes: notes.trim() || undefined,
    });
    setNotes('');
    onClose();
  };

  const getLoudnessLabel = (val: number) => {
    if (val === 0) return '0 — Полная тишина / неслышно';
    if (val <= 2) return `${val} — Едва заметный слабый фон`;
    if (val <= 4) return `${val} — Умеренный тихий звон`;
    if (val <= 6) return `${val} — Заметный постоянный шум`;
    if (val <= 8) return `${val} — Громкий навязчивый писк`;
    return `${val} — Экстремально громкий звук`;
  };

  const getDistressLabel = (val: number) => {
    if (val === 0) return '0 — Абсолютно не беспокоит';
    if (val <= 3) return `${val} — Легкий дискомфорт`;
    if (val <= 6) return `${val} — Умеренное раздражение/усталость`;
    if (val <= 8) return `${val} — Сильный стресс, мешает сосредоточиться`;
    return `${val} — Невыносимый стресс`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neuro-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neuro-900 border border-neuro-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-neuro-800/80 bg-neuro-850/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Дневник самочувствия (Шкала VAS)</h3>
              <p className="text-xs text-slate-400">Оценка интенсивности тиннитуса для отслеживания динамики</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-neuro-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* VAS Loudness Slider */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                1. Субъективная громкость тиннитуса
              </label>
              <span className="text-sm font-extrabold font-mono text-sky-400">{loudness} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={loudness}
              onChange={(e) => setLoudness(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <p className="text-xs text-sky-300/90 font-medium">{getLoudnessLabel(loudness)}</p>
          </div>

          {/* VAS Distress Slider */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                2. Уровень дискомфорта / стресса
              </label>
              <span className="text-sm font-extrabold font-mono text-emerald-400">{distress} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={distress}
              onChange={(e) => setDistress(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <p className="text-xs text-emerald-300/90 font-medium">{getDistressLabel(distress)}</p>
          </div>

          {/* Notes field */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-medium text-slate-400 tracking-wider block">
              Заметки или факторы (сон, кофе, стресс, после терапии):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: звук стал мягче после часовой сессии..."
              rows={3}
              className="w-full p-3 rounded-xl bg-neuro-850 border border-neuro-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-neuro-800 transition-all"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить оценку</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
