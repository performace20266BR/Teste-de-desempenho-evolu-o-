import React from 'react';
import { AfterburnerConfig } from '../../types/hardware';

interface MSIAfterburnerOverlayProps {
  config: AfterburnerConfig;
  fps: number;
  frametimeMs: number;
  gpuName?: string;
  frametimesHistory?: number[];
}

export const MSIAfterburnerOverlay: React.FC<MSIAfterburnerOverlayProps> = ({
  config,
  fps,
  frametimeMs,
  gpuName = 'GPU',
  frametimesHistory = [],
}) => {
  if (!config.showOSD) return null;

  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }[config.position] || 'top-3 left-3';

  const textColor = config.textColor || '#ff5500';

  // SVG mini frametime graph
  const maxFt = 33.3; // 30 FPS line
  const graphWidth = 140;
  const graphHeight = 28;

  const points = frametimesHistory.map((ft, index) => {
    const x = (index / Math.max(1, frametimesHistory.length - 1)) * graphWidth;
    const clampedFt = Math.min(maxFt, Math.max(5, ft));
    const y = graphHeight - (clampedFt / maxFt) * graphHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div
      className={`absolute ${positionClasses} pointer-events-none z-20 font-mono text-[11px] leading-tight select-none p-2 rounded bg-black/75 backdrop-blur-sm border border-black/40 shadow-xl`}
      style={{ color: textColor, textShadow: '1px 1px 0px #000' }}
    >
      <div className="flex flex-col gap-0.5">
        {/* GPU line */}
        {config.showGpuStats && (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-bold opacity-80">GPU</span>
            <span>68°C</span>
            <span>99%</span>
            <span>2550 MHz</span>
            <span>7420 MB</span>
          </div>
        )}

        {/* CPU line */}
        {config.showCpuStats && (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-bold opacity-80">CPU</span>
            <span>62°C</span>
            <span>48%</span>
            <span>5200 MHz</span>
            <span>88 W</span>
          </div>
        )}

        {/* RAM line */}
        {config.showRamStats && (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-bold opacity-80">RAM</span>
            <span>14820 MB</span>
          </div>
        )}

        {/* API & FPS line */}
        {config.showFps && (
          <div className="flex items-center gap-2 font-bold text-[13px] pt-0.5 border-t border-white/10 mt-0.5">
            <span className="text-[10px] opacity-75">D3D12</span>
            <span className="tabular-nums">{fps}</span>
            <span className="text-[10px] font-normal opacity-90">{frametimeMs} ms</span>
          </div>
        )}

        {/* Real-time frametime line graph */}
        {config.showFrametimeGraph && frametimesHistory.length > 2 && (
          <div className="mt-1 pt-1 border-t border-white/10">
            <div className="text-[9px] opacity-75 mb-0.5 flex justify-between">
              <span>FRAMETIME (ms)</span>
              <span>33.3ms</span>
            </div>
            <svg width={graphWidth} height={graphHeight} className="overflow-visible block">
              <line x1="0" y1={graphHeight * 0.5} x2={graphWidth} y2={graphHeight * 0.5} stroke="rgba(255,255,255,0.15)" strokeDasharray="2,2" />
              <polyline
                fill="none"
                stroke={textColor}
                strokeWidth="1.2"
                points={points}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
