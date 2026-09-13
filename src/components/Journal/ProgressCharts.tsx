import React from 'react';
import { SessionRecord, UserProfile } from '../../types/tinnitus';
import { Clock, Trophy, TrendingDown, Sparkles, AlertCircle, RefreshCw, Timer } from 'lucide-react';

interface ProgressChartsProps {
  sessions: SessionRecord[];
  profile: UserProfile;
  onOpenCalibration?: () => void;
  onOpenRITest?: () => void;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  sessions,
  profile,
  onOpenCalibration,
  onOpenRITest,
}) => {
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const sessionCount = sessions.length;

  // Compute average latest VAS Loudness
  const validVAS = sessions.filter((s) => s.postVASLoudness !== undefined || s.preVASLoudness !== undefined);
  const latestVAS = validVAS.length > 0 
    ? (validVAS[validVAS.length - 1].postVASLoudness ?? validVAS[validVAS.length - 1].preVASLoudness ?? 0)
    : 0;

  // Recalibration check
  const lastCalibDate = profile.lastCalibratedAt ? new Date(profile.lastCalibratedAt) : new Date(profile.createdAt);
  const daysSinceCalib = Math.max(0, Math.floor((Date.now() - lastCalibDate.getTime()) / (1000 * 60 * 60 * 24)));
  const needsRecalibration = daysSinceCalib >= 7;

  // Group by date (last 7 days)
  const last7Days: { dateStr: string; label: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });

    const dayMinutes = sessions
      .filter((s) => s.timestamp.startsWith(dateStr))
      .reduce((sum, s) => sum + Math.round(s.durationSeconds / 60), 0);

    last7Days.push({
      dateStr,
      label: dayName,
      minutes: dayMinutes,
    });
  }

  const maxMinutes = Math.max(60, ...last7Days.map((d) => d.minutes));

  // Get VAS Trend Data Points (sorted chronologically)
  const vasDataPoints = sessions
    .filter((s) => s.postVASLoudness !== undefined || s.preVASLoudness !== undefined)
    .map((s, idx) => ({
      idx: idx + 1,
      val: s.postVASLoudness ?? s.preVASLoudness ?? 0,
      date: new Date(s.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    }))
    .slice(-10); // last 10 records

  // Calibration / Frequency Migration Data
  const calibHistory = profile.calibrationHistory && profile.calibrationHistory.length > 0
    ? profile.calibrationHistory
    : [
        {
          id: 'init-point',
          timestamp: profile.lastCalibratedAt || profile.createdAt,
          frequency: profile.targetFrequency,
          earSide: profile.earSide,
          thresholdVolume: profile.thresholdVolume,
          therapeuticVolume: profile.therapeuticVolume,
        },
      ];

  const calibPoints = calibHistory.map((c, i) => ({
    idx: i + 1,
    freq: c.frequency,
    date: new Date(c.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }));

  const minFreq = Math.min(...calibPoints.map((p) => p.freq)) * 0.9;
  const maxFreq = Math.max(...calibPoints.map((p) => p.freq)) * 1.1;

  const initialFreq = calibPoints[0]?.freq || profile.targetFrequency;
  const currentFreq = calibPoints[calibPoints.length - 1]?.freq || profile.targetFrequency;
  const freqDelta = currentFreq - initialFreq;

  // RI History statistics
  const riList = profile.riHistory || [];
  const positiveRICount = riList.filter((r) => r.response === 'complete' || r.response === 'partial').length;
  const latestRI = riList.length > 0 ? riList[riList.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Recalibration Alert / Freshness Banner */}
      {needsRecalibration && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-200 block">
                Рекомендуется контрольная рекалибровка частоты (прошло {daysSinceCalib} дн.)
              </span>
              <span className="text-slate-300">
                В процессе нейропластического переобучения доминирующая частота тиннитуса смещается. Обновите частоту для поддержания максимального эффекта CR.
              </span>
            </div>
          </div>
          {onOpenCalibration && (
            <button
              onClick={onOpenCalibration}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neuro-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Проверить частоту</span>
            </button>
          )}
        </div>
      )}

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Time */}
        <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium text-slate-400">Общее время</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{totalHours}</span>
            <span className="text-xs font-mono text-slate-400">часов</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Цель: 2–4 ч/день</span>
        </div>

        {/* Sessions Count */}
        <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium text-slate-400">Сессий терапии</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{sessionCount}</span>
            <span className="text-xs font-mono text-slate-400">сессий</span>
          </div>
          <span className="text-[11px] text-emerald-400 block">Регулярность соблюдается</span>
        </div>

        {/* Latest VAS Loudness */}
        <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium text-slate-400">Громкость (VAS)</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-3xl font-extrabold font-mono text-amber-300">
              {validVAS.length > 0 ? latestVAS : '—'}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 10</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {latestVAS <= 3 ? 'Слабый / терпимый' : latestVAS <= 6 ? 'Умеренный' : 'Высокий'}
          </span>
        </div>

        {/* RI Test / Desync state */}
        <div className="p-5 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium text-slate-400">Торможение (RI)</span>
            <Timer className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-bold font-mono text-teal-300">
              {riList.length > 0 ? `${positiveRICount}/${riList.length} тест.` : 'Не тестирован'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {latestRI?.inhibitionDurationSeconds ? `Затихание: ~${latestRI.inhibitionDurationSeconds}с` : 'Проверьте через RI Тест'}
          </span>
        </div>
      </div>

      {/* Primary Chart Grid: Daily Minutes + VAS Reduction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Therapy Minutes Bar Chart */}
        <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Время терапии за последние 7 дней</h4>
              <p className="text-xs text-slate-400">Минуты ежедневного прослушивания</p>
            </div>
            <span className="text-xs font-mono text-sky-400 font-semibold">Мин/день</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-neuro-800">
            {last7Days.map((d) => {
              const heightPercent = Math.round((d.minutes / maxMinutes) * 100);
              return (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-sky-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.minutes}м
                  </span>
                  <div
                    className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400 hover:from-sky-500 hover:to-sky-300 transition-all duration-300 shadow-md shadow-sky-500/10"
                    style={{ height: `${Math.max(6, heightPercent)}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 capitalize">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* VAS Tinnitus Loudness Reduction Line Chart */}
        <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Динамика громкости тиннитуса (VAS 0–10)</h4>
              <p className="text-xs text-slate-400">Отслеживание долгосрочного эффекта десинхронизации</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold">Шкала 0–10</span>
          </div>

          {vasDataPoints.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-neuro-800 rounded-2xl">
              <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">
                Данных оценок пока нет. Нажмите <strong>«Дневник VAS»</strong> после сессии для добавления первой записи.
              </p>
            </div>
          ) : (
            <div className="h-44 flex flex-col justify-between pt-2">
              <div className="relative h-32 w-full flex items-end">
                <svg className="w-full h-full overflow-visible">
                  <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.1)" />

                  {vasDataPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={vasDataPoints
                        .map((pt, i) => {
                          const x = (i / (vasDataPoints.length - 1)) * 100;
                          const y = 100 - (pt.val / 10) * 100;
                          return `${x}%,${y}%`;
                        })
                        .join(' ')}
                    />
                  )}

                  {vasDataPoints.map((pt, i) => {
                    const x = vasDataPoints.length === 1 ? 50 : (i / (vasDataPoints.length - 1)) * 100;
                    const y = 100 - (pt.val / 10) * 100;
                    return (
                      <g key={i}>
                        <circle cx={`${x}%`} cy={`${y}%`} r="5" fill="#07090e" stroke="#fbbf24" strokeWidth="3" />
                        <text x={`${x}%`} y={`${y - 10}%`} fill="#fef08a" fontSize="10" fontFamily="monospace" textAnchor="middle">
                          {pt.val}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-neuro-800">
                {vasDataPoints.map((pt, i) => (
                  <span key={i}>{pt.date}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature 3: Frequency Migration Chart (f_T Tracking) */}
      <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-200">Трекер миграции частоты тиннитуса (f_T History)</h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Нейропластичность
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Отслеживание смещения пика патологической синхронизации по кохлеарной шкале
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Смещение частоты</span>
              <span className={`font-mono font-bold ${freqDelta < 0 ? 'text-emerald-400' : freqDelta > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {freqDelta > 0 ? `+${freqDelta} Гц` : freqDelta < 0 ? `${freqDelta} Гц` : 'Без изменений'}
              </span>
            </div>

            {onOpenRITest && (
              <button
                onClick={onOpenRITest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neuro-850 hover:bg-neuro-800 text-teal-300 text-xs font-semibold border border-teal-500/30 transition-all"
              >
                <Timer className="w-3.5 h-3.5 text-teal-400" />
                <span>Тест торможения (RI)</span>
              </button>
            )}
          </div>
        </div>

        {/* Frequency Migration Line Chart */}
        <div className="h-44 flex flex-col justify-between pt-2">
          <div className="relative h-32 w-full flex items-end">
            <svg className="w-full h-full overflow-visible">
              <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.1)" />

              {calibPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={calibPoints
                    .map((pt, i) => {
                      const x = (i / (calibPoints.length - 1)) * 100;
                      const y = 100 - ((pt.freq - minFreq) / (maxFreq - minFreq || 1)) * 100;
                      return `${x}%,${y}%`;
                    })
                    .join(' ')}
                />
              )}

              {calibPoints.map((pt, i) => {
                const x = calibPoints.length === 1 ? 50 : (i / (calibPoints.length - 1)) * 100;
                const y = 100 - ((pt.freq - minFreq) / (maxFreq - minFreq || 1)) * 100;
                return (
                  <g key={i}>
                    <circle cx={`${x}%`} cy={`${y}%`} r="5" fill="#07090e" stroke="#38bdf8" strokeWidth="3" />
                    <text x={`${x}%`} y={`${y - 10}%`} fill="#7dd3fc" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {pt.freq} Гц
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-neuro-800">
            {calibPoints.map((pt, i) => (
              <span key={i}>{pt.date}</span>
            ))}
          </div>
        </div>

        {/* Explanation footnote */}
        <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-neuro-800/60">
          💡 По мере долгосрочной депрессии патологических связей слуховой коры частота тиннитуса часто сдвигается вниз или распадается на более тихие компоненты. Проводите повторную калибровку раз в 7–10 дней для синхронизации стимуляции с актуальным состоянием.
        </p>
      </div>
    </div>
  );
};
