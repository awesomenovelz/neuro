import React from 'react';
import { SessionRecord } from '../../types/tinnitus';
import { Download, Trash2, Calendar, Clock, MessageSquare } from 'lucide-react';

interface HistoryListProps {
  sessions: SessionRecord[];
  onClearHistory: () => void;
  onOpenVASModal: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  sessions,
  onClearHistory,
  onOpenVASModal,
}) => {
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroreset-tinnitus-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs} ч ${remMins} мин`;
    }
    return `${mins} мин ${rem > 0 ? `${rem} с` : ''}`;
  };

  return (
    <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            История сессий и дневник самочувствия
          </h3>
          <p className="text-xs text-slate-400">
            Всего записей: <strong className="text-slate-200">{sessions.length}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenVASModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
          >
            + Новая оценка VAS
          </button>

          {sessions.length > 0 && (
            <>
              <button
                onClick={exportJSON}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neuro-850 hover:bg-neuro-800 text-slate-300 text-xs font-medium border border-neuro-750 transition-all"
                title="Экспортировать историю в JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Экспорт</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите очистить историю всех сессий?')) {
                    onClearHistory();
                  }
                }}
                className="p-2 rounded-xl bg-neuro-850 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-neuro-750 transition-all"
                title="Очистить историю"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Items */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neuro-800 rounded-2xl space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-400">История сессий пока пуста</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Завершите свою первую сессию терапии в разделе «Терапия», чтобы начать накопление статистики.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neuro-800/80 max-h-96 overflow-y-auto pr-1">
          {sessions.slice().reverse().map((session) => {
            const date = new Date(session.timestamp);
            const dateStr = date.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            const timeStr = date.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={session.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{dateStr}</span>
                    <span className="text-[11px] font-mono text-slate-500">{timeStr}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      f_T: {session.targetFrequency} Гц
                    </span>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-slate-400 flex items-start gap-1.5 pt-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{session.notes}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {/* Duration */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Время</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatDuration(session.durationSeconds)}
                    </span>
                  </div>

                  {/* VAS Loudness */}
                  {(session.postVASLoudness !== undefined || session.preVASLoudness !== undefined) && (
                    <div className="text-right pl-3 border-l border-neuro-800">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">VAS Громкость</span>
                      <span className="font-mono font-bold text-amber-300">
                        {session.postVASLoudness ?? session.preVASLoudness}/10
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
