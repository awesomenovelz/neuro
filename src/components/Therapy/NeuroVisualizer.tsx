import React, { useRef, useEffect } from 'react';
import { CRChannel } from '../../types/tinnitus';

interface NeuroVisualizerProps {
  channels: CRChannel[];
  activeChannelIndex: number | null;
  activeCycle: number; // 0..4
  isSilenceCycle: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  targetFrequency: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const NeuroVisualizer: React.FC<NeuroVisualizerProps> = ({
  channels,
  activeChannelIndex,
  activeCycle,
  isSilenceCycle,
  isPlaying,
  isPaused,
  targetFrequency,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; color: string; alpha: number }[]>([]);
  const lastActiveIndex = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Trigger visual shockwave/particles when active channel changes
  useEffect(() => {
    if (activeChannelIndex !== null && activeChannelIndex !== lastActiveIndex.current) {
      lastActiveIndex.current = activeChannelIndex;
      const ch = channels[activeChannelIndex];
      if (!ch) return;

      const angle = (activeChannelIndex * (Math.PI / 2)) - Math.PI / 4;
      const dist = 110;
      const nodeX = Math.cos(angle) * dist;
      const nodeY = Math.sin(angle) * dist;

      // Add shockwave
      shockwavesRef.current.push({
        x: nodeX,
        y: nodeY,
        radius: 5,
        maxRadius: 65,
        color: ch.color,
        alpha: 1.0,
      });

      // Spawn synaptic discharge particles toward center
      for (let i = 0; i < 14; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const speed = 2.0 + Math.random() * 3.5;
        const particleAngle = Math.atan2(-nodeY, -nodeX) + spread;

        particlesRef.current.push({
          x: nodeX,
          y: nodeY,
          vx: Math.cos(particleAngle) * speed,
          vy: Math.sin(particleAngle) * speed,
          radius: 2 + Math.random() * 2.5,
          color: ch.color,
          alpha: 1.0,
          life: 0,
          maxLife: 35 + Math.random() * 20,
        });
      }
    } else if (activeChannelIndex === null) {
      lastActiveIndex.current = null;
    }
  }, [activeChannelIndex, channels]);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 360;
      }
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      timeRef.current += 0.025;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const orbitRadius = Math.min(125, width * 0.28);

      ctx.save();
      ctx.translate(centerX, centerY);

      // 1. Draw outer glowing background rings (Auditory cortex field)
      ctx.beginPath();
      ctx.arc(0, 0, orbitRadius + 28, 0, Math.PI * 2);
      ctx.strokeStyle = isPlaying && !isPaused ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Draw 5-Segment 3:2 Cycle Indicator Ring
      const segmentCount = 5;
      const segmentGap = 0.08;
      const segAngle = (Math.PI * 2) / segmentCount;

      for (let i = 0; i < segmentCount; i++) {
        const startA = i * segAngle + segmentGap / 2 - Math.PI / 2;
        const endA = (i + 1) * segAngle - segmentGap / 2 - Math.PI / 2;

        ctx.beginPath();
        ctx.arc(0, 0, orbitRadius + 18, startA, endA);

        const isActiveThisCycle = isPlaying && activeCycle === i;
        const isSilenceSeg = i >= 3;

        if (isActiveThisCycle) {
          ctx.strokeStyle = isSilenceSeg ? '#fbbf24' : '#38bdf8';
          ctx.lineWidth = 4;
          ctx.shadowColor = isSilenceSeg ? 'rgba(251, 191, 36, 0.8)' : 'rgba(56, 189, 248, 0.8)';
          ctx.shadowBlur = 12;
        } else {
          ctx.strokeStyle = isSilenceSeg ? 'rgba(251, 191, 36, 0.15)' : 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 3. Draw Connecting Neural Axes
      for (let i = 0; i < 4; i++) {
        const angle = (i * (Math.PI / 2)) - Math.PI / 4;
        const nx = Math.cos(angle) * orbitRadius;
        const ny = Math.sin(angle) * orbitRadius;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = activeChannelIndex === i ? `${channels[i]?.color || '#38bdf8'}66` : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = activeChannelIndex === i ? 2 : 1;
        ctx.stroke();
      }

      // 4. Update and Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 5. Update and Render Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 2.2;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha * 0.7;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        if (sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
        }
      }

      // 6. Draw Center Auditory Core (f_T)
      const corePulse = isPlaying && !isPaused ? Math.sin(t * 4) * 3 : 0;
      const coreRadius = 34 + corePulse;

      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, coreRadius);
      if (isSilenceCycle) {
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(0.6, 'rgba(251, 191, 36, 0.4)');
        grad.addColorStop(1, 'rgba(12, 16, 23, 0.9)');
      } else {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
        grad.addColorStop(1, 'rgba(12, 16, 23, 0.9)');
      }

      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = isSilenceCycle ? 'rgba(251, 191, 36, 0.5)' : 'rgba(56, 189, 248, 0.5)';
      ctx.shadowBlur = isPlaying ? 20 : 5;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Center text inside core
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${targetFrequency} Hz`, 0, -4);

      ctx.fillStyle = isSilenceCycle ? '#fbbf24' : '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(
        !isPlaying
          ? 'Ожидание'
          : isSilenceCycle
          ? 'Пауза CR'
          : `Цикл ${activeCycle + 1}/3`,
        0,
        12
      );

      // 7. Draw 4 Frequency Outer Nodes
      channels.forEach((ch, idx) => {
        const angle = (idx * (Math.PI / 2)) - Math.PI / 4;
        const nx = Math.cos(angle) * orbitRadius;
        const ny = Math.sin(angle) * orbitRadius;

        const isActive = activeChannelIndex === idx;
        const nodeRadius = isActive ? 20 : 14;

        // Outer glow on active
        if (isActive) {
          ctx.beginPath();
          ctx.arc(nx, ny, nodeRadius + 8, 0, Math.PI * 2);
          ctx.fillStyle = `${ch.color}33`;
          ctx.fill();
        }

        // Main node body
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? ch.color : '#111722';
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = isActive ? 3 : 1.5;
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = isActive ? 22 : 4;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label inside node
        ctx.fillStyle = isActive ? '#07090e' : '#f1f5f9';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText(ch.label, nx, ny);

        // Frequency tag outside node
        const tagDist = orbitRadius + 32;
        const tx = Math.cos(angle) * tagDist;
        const ty = Math.sin(angle) * tagDist;

        ctx.fillStyle = isActive ? ch.color : '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${ch.frequency} Hz`, tx, ty);
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [channels, activeChannelIndex, activeCycle, isSilenceCycle, isPlaying, isPaused, targetFrequency]);

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-neuro-900 via-neuro-900 to-neuro-950 border border-neuro-800/80 shadow-2xl p-4 overflow-hidden">
      {/* Visualizer Status Bar */}
      <div className="flex items-center justify-between px-2 mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="font-mono uppercase tracking-wider text-slate-400 text-[11px]">
            Нейро-десинхронизация (60 FPS)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
              !isPlaying
                ? 'bg-neuro-800 border-neuro-700 text-slate-400'
                : isSilenceCycle
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {!isPlaying
              ? 'ГОТОВ К СТАРТУ'
              : isSilenceCycle
              ? 'ДЕАКТИВАЦИЯ (2 ЦИКЛА)'
              : `АКТИВНАЯ СТИМУЛЯЦИЯ (${activeCycle + 1}/3)`}
          </span>
        </div>
      </div>

      <div className="w-full flex justify-center items-center">
        <canvas ref={canvasRef} className="w-full max-w-lg h-[340px] block" />
      </div>

      {/* 3:2 Protocol Legend */}
      <div className="flex items-center justify-center gap-4 mt-1 pt-3 border-t border-neuro-800/50 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>3 цикла стимуляции</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>2 цикла паузы (нейропластичность)</span>
        </div>
      </div>
    </div>
  );
};
