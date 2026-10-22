import React, { useState } from 'react';
import { AfterburnerConfig } from '../../types/hardware';

interface AfterburnerPanelProps {
  config: AfterburnerConfig;
  onChangeConfig: (config: AfterburnerConfig) => void;
  recordedFrametimes?: number[];
}

export const AfterburnerPanel: React.FC<AfterburnerPanelProps> = ({
  config,
  onChangeConfig,
  recordedFrametimes = [],
}) => {
  const [coreOffset, setCoreOffset] = useState<number>(config.coreClockOffset || 0);
  const [memOffset, setMemOffset] = useState<number>(0);
  const [powerLimit, setPowerLimit] = useState<number>(config.powerLimitPercent || 100);
  const [fanSpeed, setFanSpeed] = useState<number>(config.fanSpeedCurve || 55);
  const [isAutoFan, setIsAutoFan] = useState<boolean>(true);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  const updateConfig = (patch: Partial<AfterburnerConfig>) => {
    onChangeConfig({
      ...config,
      ...patch,
    });
  };

  const handleExportCSV = () => {
    if (recordedFrametimes.length === 0) {
      alert('Nenhum dado de frametime registrado ainda. Execute um benchmark 3D para gerar o log!');
      return;
    }
    const csvContent = 'data:text/csv;charset=utf-8,Frame,Frametime_ms,Instant_FPS\n' +
      recordedFrametimes.map((ft, idx) => `${idx + 1},${ft.toFixed(2)},${(1000 / ft).toFixed(1)}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hw_bench_frametimes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    if (recordedFrametimes.length === 0) return;
    const avg = recordedFrametimes.reduce((a, b) => a + b, 0) / recordedFrametimes.length;
    const avgFps = (1000 / avg).toFixed(1);
    const sorted = [...recordedFrametimes].sort((a, b) => a - b);
    const onePercent = (1000 / sorted[Math.floor(sorted.length * 0.99)]).toFixed(1);
    const text = `HW-Bench MSI Log:\nTotal Frames: ${recordedFrametimes.length}\nAvg FPS: ${avgFps}\n1% Low: ${onePercent}\nPower Limit: ${powerLimit}%\nCore Offset: +${coreOffset}MHz`;
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block"></span>
            MSI Afterburner & RTSS Monitor
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configuração do OSD (On-Screen Display), ajuste de limites e captura de frametimes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateConfig({ showOSD: !config.showOSD })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              config.showOSD
                ? 'bg-orange-500 text-black hover:bg-orange-400'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {config.showOSD ? 'OSD Ativo (Exibindo HUD)' : 'OSD Oculto (Ativar HUD)'}
          </button>
        </div>
      </div>

      {/* Grid: OSD Display Options & Hardware Tuning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: OSD Controls */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Personalização do OSD (HUD em Tela)
          </div>

          <div className="space-y-3 bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-xs">
            {/* Position */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Posição na Tela</span>
              <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
                {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => updateConfig({ position: pos })}
                    className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                      config.position === pos ? 'bg-orange-500 text-black font-semibold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Cor do HUD</span>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Orange', color: '#ff5500' },
                  { name: 'Cyan', color: '#00e5ff' },
                  { name: 'Toxic Green', color: '#00e676' },
                  { name: 'White', color: '#ffffff' },
                ].map(item => (
                  <button
                    key={item.color}
                    onClick={() => updateConfig({ textColor: item.color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      config.textColor === item.color ? 'scale-115 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  />
                ))}
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGpuStats}
                  onChange={(e) => updateConfig({ showGpuStats: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-0"
                />
                <span>Métricas GPU (Temp/Clock)</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCpuStats}
                  onChange={(e) => updateConfig({ showCpuStats: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-0"
                />
                <span>Métricas CPU (Temp/Clock)</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showFps}
                  onChange={(e) => updateConfig({ showFps: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-0"
                />
                <span>FPS & Frametime Numérico</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showFrametimeGraph}
                  onChange={(e) => updateConfig({ showFrametimeGraph: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-900 text-orange-500 focus:ring-0"
                />
                <span>Gráfico Frametime (ms)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Tuning & Limits */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Ajustes de Desempenho & Limites
          </div>

          <div className="space-y-4 bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-xs">
            {/* Core Clock Offset */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1.5">
                <span>GPU Core Clock Offset</span>
                <span className="font-mono text-orange-400 font-semibold">+{coreOffset} MHz</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="10"
                value={coreOffset}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCoreOffset(val);
                  updateConfig({ coreClockOffset: val });
                }}
                className="w-full accent-orange-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Memory Clock Offset */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1.5">
                <span>GPU Memory Clock Offset</span>
                <span className="font-mono text-orange-400 font-semibold">+{memOffset} MHz</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={memOffset}
                onChange={(e) => setMemOffset(Number(e.target.value))}
                className="w-full accent-orange-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Power Limit */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1.5">
                <span>Power Limit (%)</span>
                <span className="font-mono text-orange-400 font-semibold">{powerLimit}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="125"
                step="1"
                value={powerLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPowerLimit(val);
                  updateConfig({ powerLimitPercent: val });
                }}
                className="w-full accent-orange-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Fan Speed Curve */}
            <div>
              <div className="flex justify-between text-neutral-300 mb-1.5">
                <div className="flex items-center gap-2">
                  <span>Velocidade das Ventoinhas</span>
                  <button
                    onClick={() => setIsAutoFan(!isAutoFan)}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${isAutoFan ? 'bg-orange-500 text-black font-semibold' : 'bg-neutral-800 text-neutral-400'}`}
                  >
                    {isAutoFan ? 'AUTO' : 'MANUAL'}
                  </button>
                </div>
                <span className="font-mono text-orange-400 font-semibold">{isAutoFan ? 'Curva Auto (~55%)' : `${fanSpeed}%`}</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                disabled={isAutoFan}
                value={fanSpeed}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFanSpeed(val);
                  updateConfig({ fanSpeedCurve: val });
                }}
                className="w-full accent-orange-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RTSS Frametime Log and Export Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400">
        <div>
          <span>Frametimes em buffer: </span>
          <span className="font-mono text-neutral-200 font-semibold">
            {recordedFrametimes.length} quadros gravados
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedLog ? 'Copiado!' : 'Copiar Resumo'}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Exportar CSV do RTSS
          </button>
        </div>
      </div>
    </div>
  );
};
