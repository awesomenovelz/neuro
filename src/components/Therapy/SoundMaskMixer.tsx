import { Waves, Wind, Shield } from 'lucide-react';

interface SoundMaskMixerProps {
  noiseType: 'none' | 'pink' | 'ocean' | 'brown';
  onNoiseTypeChange: (type: 'none' | 'pink' | 'ocean' | 'brown') => void;
  noiseVolume: number;
  onNoiseVolumeChange: (vol: number) => void;
}

export const SoundMaskMixer: React.FC<SoundMaskMixerProps> = ({
  noiseType,
  onNoiseTypeChange,
  noiseVolume,
  onNoiseVolumeChange,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-neuro-900 border border-neuro-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-sky-400" />
          <span className="text-xs uppercase font-semibold text-slate-200 tracking-wider">
            Фоновый маскирующий шум (Опционально)
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {noiseType === 'none' ? 'Выключен' : `${Math.round(noiseVolume * 100)}%`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => onNoiseTypeChange('none')}
          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
            noiseType === 'none'
              ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
              : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
          }`}
        >
          Без шума
        </button>

        <button
          onClick={() => onNoiseTypeChange('pink')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
            noiseType === 'pink'
              ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
              : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Розовый</span>
        </button>

        <button
          onClick={() => onNoiseTypeChange('ocean')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
            noiseType === 'ocean'
              ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-sm'
              : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Океан</span>
        </button>

        <button
          onClick={() => onNoiseTypeChange('brown')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
            noiseType === 'brown'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
              : 'bg-neuro-850 border-neuro-800 text-slate-400 hover:bg-neuro-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Коричневый</span>
        </button>
      </div>

      {noiseType !== 'none' && (
        <div className="pt-2 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Громкость фона:</span>
            <span className="font-mono text-sky-400">{Math.round(noiseVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.6"
            step="0.01"
            value={noiseVolume}
            onChange={(e) => onNoiseVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      )}
    </div>
  );
};
