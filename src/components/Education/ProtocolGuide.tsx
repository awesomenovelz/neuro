import { BookOpen, Brain, Activity, CheckCircle2, AlertTriangle, Sparkles, Headphones } from 'lucide-react';

export const ProtocolGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-neuro-900 via-neuro-850 to-neuro-900 border border-neuro-800 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono">
          <Brain className="w-3.5 h-3.5" />
          <span>Клиническая нейробиология слуха</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-emerald-200 to-purple-300 bg-clip-text text-transparent">
          Acoustic CR Neuromodulation
        </h2>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Научно обоснованный метод терапии тиннитуса, разработанный профессором Петером Тассом (Peter A. Tass) в Исследовательском центре Юлиха (Forschungszentrum Jülich, Германия).
        </p>
      </div>

      {/* 3 Core Principles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">1. Патологическая синхронизация</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            При повреждении волосковых клеток слуховая кора начинает генерировать аномальный синхронный гиперритм нейронов, который мозг воспринимает как постоянный звон или писк.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">2. Десинхронизация (CR Reset)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Подача 4 тонов вокруг частоты тиннитуса с микро-сдвигом по фазе делит гиперактивный кластер нейронов на подгруппы и разрушает патологическую синхронность.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">3. Долгосрочная синаптическая пластичность</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Паузы в схеме 3:2 стимулируют долгосрочное ослабление патологических синапсов (Long-Term Depression, LTD), закрепляя эффект даже после окончания стимуляции.
          </p>
        </div>
      </div>

      {/* Protocol Structure & Mathematical Formula */}
      <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-6">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          Схема стимуляции и расчет частот
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neuro-850 border border-neuro-800 space-y-2">
            <span className="font-mono text-sky-400 font-bold uppercase block">Паттерн 3:2 ON/OFF</span>
            <p className="text-slate-300 leading-relaxed">
              3 последовательных цикла стимуляции (каждый содержит 4 тона в случайном порядке) сменяются 2 циклами тишины. Этот ритмический контраст критически важен для нейропластического переобучения коры.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neuro-850 border border-neuro-800 space-y-2">
            <span className="font-mono text-emerald-400 font-bold uppercase block">Кохлеотопическое позиционирование</span>
            <p className="text-slate-300 leading-relaxed">
              Частоты $f_1, f_2, f_3, f_4$ рассчитываются по логарифмической шкале базилярной мембраны:
              <br />
              <code className="text-slate-200 block pt-1 font-mono font-semibold">
                f1 ≈ 0.77·fT | f2 ≈ 0.90·fT | f3 ≈ 1.10·fT | f4 ≈ 1.40·fT
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Practical Recommendations for Patients */}
      <div className="p-6 rounded-3xl bg-neuro-900 border border-neuro-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Headphones className="w-5 h-5 text-emerald-400" />
          Практические рекомендации по применению
        </h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Ежедневная продолжительность:</strong> Оптимальный режим — <strong>2–4 часа в день</strong>, разделенные на сессии по 30–60 минут (например, 1 час утром и 1–2 часа вечером).
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Уровень громкости (Sensation Level):</strong> Звук должен быть комфортным и тихим (чуть выше порога слышимости). Не делайте звук громким — это не маскировщик! Вы должны спокойно слышать окружающую речь.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Наушники:</strong> Используйте качественные полноразмерные или внутриканальные наушники с нейтральной АЧХ. Не используйте моно-гарнитуры.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Сроки и динамика:</strong> Первые улучшения (кратковременное стихание звона после сессии — residual inhibition) могут наступать через несколько дней. Устойчивый долгосрочный эффект обычно формируется за <strong>8–12 недель регулярных занятий</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block text-amber-100">Медицинское предупреждение и техника безопасности</strong>
          <p className="text-amber-200/90 leading-relaxed">
            Программа является инструментом акустической тренировки и нейромодуляции. Если у вас внезапно развился односторонний тиннитус, сопровождающийся резкой потерей слуха или головокружением, незамедлительно обратитесь к врачу-сурдологу или отоларингологу (ЛОР). Не устанавливайте громкость стимуляции на опасные для слуха уровни.
          </p>
        </div>
      </div>
    </div>
  );
};
