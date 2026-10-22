import React, { useState, useMemo } from 'react';
import { SystemSpecs } from '../../types/hardware';
import { calculateBottleneck, CPU_DATABASE, GPU_DATABASE } from '../../utils/benchmarks/bottleneckCalculator';

interface BottleneckBenchViewProps {
  specs: SystemSpecs;
  onLaunchLiveSimulation?: () => void;
}

export const BottleneckBenchView: React.FC<BottleneckBenchViewProps> = ({
  specs,
  onLaunchLiveSimulation,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '1440p' | '4K'>('1080p');
  const [customCpuName, setCustomCpuName] = useState<string>(specs.cpu.name);
  const [customGpuName, setCustomGpuName] = useState<string>(specs.gpu.name);

  // Compute bottleneck analysis
  const mockCpu = useMemo(() => ({
    ...specs.cpu,
    name: customCpuName,
  }), [specs.cpu, customCpuName]);

  const mockGpu = useMemo(() => ({
    ...specs.gpu,
    name: customGpuName,
  }), [specs.gpu, customGpuName]);

  const report = useMemo(() => {
    return calculateBottleneck(mockCpu, mockGpu, specs.memory, selectedResolution);
  }, [mockCpu, mockGpu, specs.memory, selectedResolution]);

  const isCpuBottleneck = report.bottleneckType === 'CPU_BOTTLENECK';
  const isGpuBound = report.bottleneckType === 'GPU_BOTTLENECK';
  const isBalanced = report.bottleneckType === 'BALANCED';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"></span>
            Calculador & Benchmark de Gargalo (CPU x GPU Bottleneck)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Analise o equilíbrio entre processador e placa de vídeo para evitar perda de desempenho e quedas de FPS (1% Low).
          </p>
        </div>

        {onLaunchLiveSimulation && (
          <button
            onClick={onLaunchLiveSimulation}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            Abrir Simulação 3D em Tempo Real
          </button>
        )}
      </div>

      {/* Selectors: Hardware & Resolution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs">
        <div>
          <label className="text-neutral-400 block mb-1.5 font-medium">Processador (CPU)</label>
          <select
            value={customCpuName}
            onChange={(e) => setCustomCpuName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-200 text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value={specs.cpu.name}>{specs.cpu.name} (Atual)</option>
            {CPU_DATABASE.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.tier})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-neutral-400 block mb-1.5 font-medium">Placa de Vídeo (GPU)</label>
          <select
            value={customGpuName}
            onChange={(e) => setCustomGpuName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-neutral-200 text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value={specs.gpu.name}>{specs.gpu.name} (Atual)</option>
            {GPU_DATABASE.map(g => (
              <option key={g.name} value={g.name}>
                {g.name} ({g.tier})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-neutral-400 block mb-1.5 font-medium">Resolução Alvo</label>
          <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            {(['1080p', '1440p', '4K'] as const).map(res => (
              <button
                key={res}
                onClick={() => setSelectedResolution(res)}
                className={`py-1 text-xs font-semibold rounded transition-colors ${
                  selectedResolution === res
                    ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottleneck Score Banner */}
      <div className={`p-4 rounded-xl border ${
        isCpuBottleneck
          ? 'bg-amber-950/20 border-amber-800/60'
          : isGpuBound
          ? 'bg-sky-950/20 border-sky-800/60'
          : 'bg-emerald-950/20 border-emerald-800/60'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Diagnóstico de Balanceamento
            </span>
            <h4 className={`text-lg font-bold ${
              isCpuBottleneck ? 'text-amber-400' : isGpuBound ? 'text-sky-400' : 'text-emerald-400'
            }`}>
              {report.summaryPt}
            </h4>
            <p className="text-xs text-neutral-300 max-w-2xl">
              {report.recommendedComponent}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-neutral-400">Índice de Gargalo</div>
            <div className={`text-3xl font-extrabold font-mono ${
              isCpuBottleneck ? 'text-amber-400' : isGpuBound ? 'text-sky-400' : 'text-emerald-400'
            }`}>
              {report.bottleneckPercentage}%
            </div>
          </div>
        </div>

        {/* Load Comparison Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-800/80 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-neutral-400">Uso Estimado da CPU:</span>
              <span className="font-mono font-bold text-neutral-200">{report.cpuUtilizationAvg}%</span>
            </div>
            <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  report.cpuUtilizationAvg > 90 ? 'bg-amber-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${report.cpuUtilizationAvg}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-neutral-400">Uso Estimado da GPU:</span>
              <span className="font-mono font-bold text-neutral-200">{report.gpuUtilizationAvg}%</span>
            </div>
            <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  report.gpuUtilizationAvg > 90 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${report.gpuUtilizationAvg}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Details */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Análise Técnica Detalhada
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {report.detailsPt.map((detail, idx) => (
            <div key={idx} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-neutral-300 flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">✓</span>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projected Gaming Benchmarks Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Projeção de FPS em Jogos Populares
          </h5>
          <span className="text-[11px] text-neutral-500 font-mono">
            Gráficos Ultra / Competitivo Otimizado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {report.gameEstimates.map(game => {
            const currentFps = selectedResolution === '1080p'
              ? game.res1080p
              : selectedResolution === '1440p'
              ? game.res1440p
              : game.res4K;

            return (
              <div
                key={game.gameName}
                className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex flex-col justify-between"
              >
                <div>
                  <div className="font-semibold text-neutral-200 text-xs">{game.gameName}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Resolução: {selectedResolution}
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between border-t border-neutral-900 pt-2">
                  <span className="text-[11px] text-neutral-500">Média Estimada</span>
                  <span className="font-mono text-xl font-bold text-cyan-400">
                    {currentFps} <span className="text-xs text-neutral-500 font-normal">FPS</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
