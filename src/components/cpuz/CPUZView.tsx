import React, { useState } from 'react';
import { SystemSpecs, CPUBenchmarkResult } from '../../types/hardware';
import { CPU_Z_REFERENCES } from '../../utils/hardwareDetector';
import { runCPUBenchmark, CPUStressTester } from '../../utils/benchmarks/cpuBenchmark';

interface CPUZViewProps {
  specs: SystemSpecs;
  onBenchmarkScoreGenerated?: (score: CPUBenchmarkResult) => void;
}

export const CPUZView: React.FC<CPUZViewProps> = ({ specs, onBenchmarkScoreGenerated }) => {
  const [activeTab, setActiveTab] = useState<'CPU' | 'Mainboard' | 'Memory' | 'Graphics' | 'Bench'>('CPU');
  
  // Benchmark states
  const [referenceCpuId, setReferenceCpuId] = useState<string>('i9-14900k');
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchProgressText, setBenchProgressText] = useState<string>('');
  const [benchProgressPct, setBenchProgressPct] = useState<number>(0);
  const [benchmarkResult, setBenchmarkResult] = useState<CPUBenchmarkResult | null>(null);

  // Stress test states
  const [isStressRunning, setIsStressRunning] = useState<boolean>(false);
  const [stressTesterRef] = useState<CPUStressTester>(() => new CPUStressTester());
  const [stressStats, setStressStats] = useState<{ temp: number; load: number; throttled: boolean; powerW: number } | null>(null);

  const selectedRefCpu = CPU_Z_REFERENCES.find(r => r.id === referenceCpuId) || CPU_Z_REFERENCES[0];

  const handleRunBench = async () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setBenchProgressPct(0);

    try {
      const res = await runCPUBenchmark(
        specs.cpu.cores,
        specs.cpu.threads,
        referenceCpuId,
        (step, pct) => {
          setBenchProgressText(step);
          setBenchProgressPct(pct);
        }
      );
      setBenchmarkResult(res);
      onBenchmarkScoreGenerated?.(res);
    } finally {
      setIsBenchmarking(false);
      setBenchProgressText('');
    }
  };

  const handleToggleStress = () => {
    if (isStressRunning) {
      stressTesterRef.stop();
      setIsStressRunning(false);
      setStressStats(null);
    } else {
      setIsStressRunning(true);
      stressTesterRef.start(specs.cpu.threads, specs.cpu.tdp, (stats) => {
        setStressStats(stats);
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-neutral-900 border border-neutral-700/80 rounded-xl overflow-hidden shadow-2xl font-sans text-neutral-200">
      {/* Title Bar styled like classic CPU-Z window header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-neutral-800 to-neutral-900 border-b border-neutral-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-cyan-400">CPU-Z</span>
          <span className="text-neutral-400">v2.09.0 · x64</span>
        </div>
        <div className="text-neutral-500 font-mono text-[11px]">
          {specs.platform}
        </div>
      </div>

      {/* Retro CPU-Z Tab Bar */}
      <div className="flex items-center bg-neutral-950 px-2 pt-2 border-b border-neutral-800 gap-1 overflow-x-auto">
        {(['CPU', 'Mainboard', 'Memory', 'Graphics', 'Bench'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t border-t border-x transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'bg-neutral-800 text-white border-neutral-700 -mb-[1px] pb-2'
                : 'bg-neutral-900/40 text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="p-4 bg-neutral-900 min-h-[380px] text-xs space-y-4">
        {/* TAB 1: CPU */}
        {activeTab === 'CPU' && (
          <div className="space-y-3">
            {/* Processor Box */}
            <fieldset className="border border-neutral-700/80 rounded-lg p-3 relative bg-neutral-950/40">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Processor</legend>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex">
                  <span className="w-24 text-neutral-400">Name:</span>
                  <span className="font-semibold text-white truncate">{specs.cpu.name}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-400">Code Name:</span>
                  <span className="text-neutral-300">{specs.cpu.codeName}</span>
                  <span className="ml-auto text-neutral-400 mr-1">Max TDP:</span>
                  <span className="text-neutral-200 font-semibold">{specs.cpu.tdp} W</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-400">Package:</span>
                  <span className="text-neutral-300">{specs.cpu.package}</span>
                  <span className="ml-auto text-neutral-400 mr-1">Technology:</span>
                  <span className="text-neutral-200">{specs.cpu.technology}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-400">Specification:</span>
                  <span className="text-neutral-300 truncate">{specs.cpu.specification}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-neutral-400">Family:</span>
                  <span className="text-neutral-200">{specs.cpu.family}</span>
                  <span className="ml-6 text-neutral-400 mr-2">Model:</span>
                  <span className="text-neutral-200">{specs.cpu.model}</span>
                  <span className="ml-6 text-neutral-400 mr-2">Stepping:</span>
                  <span className="text-neutral-200">{specs.cpu.stepping}</span>
                </div>
                <div className="flex items-start pt-1">
                  <span className="w-24 text-neutral-400 shrink-0">Instructions:</span>
                  <span className="text-neutral-300 text-[10px] leading-tight">
                    {specs.cpu.instructions.join(', ')}
                  </span>
                </div>
              </div>
            </fieldset>

            {/* Clocks & Cache Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40">
                <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Clocks (Core #0)</legend>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Core Speed:</span>
                    <span className="text-cyan-400 font-semibold">{specs.cpu.coreSpeed} MHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Multiplier:</span>
                    <span className="text-neutral-200">{specs.cpu.multiplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Bus Speed:</span>
                    <span className="text-neutral-200">{specs.cpu.busSpeed.toFixed(1)} MHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Rated Boost:</span>
                    <span className="text-neutral-200 font-semibold">{specs.cpu.boostClock} GHz</span>
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40">
                <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Cache Hierarchy</legend>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">L1 Data:</span>
                    <span className="text-neutral-300 truncate max-w-[150px]">{specs.cpu.l1DataCache}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">L1 Inst:</span>
                    <span className="text-neutral-300 truncate max-w-[150px]">{specs.cpu.l1InstCache}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Level 2:</span>
                    <span className="text-neutral-300 truncate max-w-[150px]">{specs.cpu.level2Cache}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Level 3:</span>
                    <span className="text-neutral-300 truncate max-w-[150px]">{specs.cpu.level3Cache}</span>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Bottom summary cores/threads */}
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span>Cores: <strong className="text-cyan-400">{specs.cpu.cores}</strong></span>
                <span>Threads: <strong className="text-cyan-400">{specs.cpu.threads}</strong></span>
              </div>
              <div className="text-neutral-400 text-[11px]">
                {specs.cpu.pCores ? `${specs.cpu.pCores}P + ${specs.cpu.eCores || 0}E` : 'Uniform Cores'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Mainboard */}
        {activeTab === 'Mainboard' && (
          <div className="space-y-3 font-mono text-[11px]">
            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Motherboard</legend>
              <div className="flex">
                <span className="w-28 text-neutral-400">Manufacturer:</span>
                <span className="font-semibold text-white">{specs.motherboard.manufacturer}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Model:</span>
                <span className="text-neutral-200">{specs.motherboard.model}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Chipset:</span>
                <span className="text-neutral-200">{specs.motherboard.chipset}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Southbridge:</span>
                <span className="text-neutral-200">{specs.motherboard.southbridge}</span>
              </div>
            </fieldset>

            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">BIOS</legend>
              <div className="flex">
                <span className="w-28 text-neutral-400">Version:</span>
                <span className="text-cyan-400 font-semibold">{specs.motherboard.biosVersion}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Date:</span>
                <span className="text-neutral-200">{specs.motherboard.biosDate}</span>
              </div>
            </fieldset>

            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Graphic Interface</legend>
              <div className="flex">
                <span className="w-28 text-neutral-400">Bus Spec:</span>
                <span className="text-neutral-200">{specs.motherboard.graphicInterface}</span>
              </div>
            </fieldset>
          </div>
        )}

        {/* TAB 3: Memory */}
        {activeTab === 'Memory' && (
          <div className="space-y-3 font-mono text-[11px]">
            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">General</legend>
              <div className="flex justify-between">
                <span className="text-neutral-400">Type:</span>
                <span className="text-cyan-400 font-semibold">{specs.memory.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Size:</span>
                <span className="text-neutral-100 font-bold">{specs.memory.sizeGB} GBytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Channel #:</span>
                <span className="text-neutral-200">{specs.memory.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">XMP / EXPO:</span>
                <span className="text-emerald-400 font-semibold">{specs.memory.xmpProfile}</span>
              </div>
            </fieldset>

            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Timings</legend>
              <div className="flex justify-between">
                <span className="text-neutral-400">DRAM Frequency:</span>
                <span className="text-white font-semibold">{specs.memory.dramFrequency} MHz ({specs.memory.dramFrequency * 2} MT/s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">FSB:DRAM:</span>
                <span className="text-neutral-300">{specs.memory.fsbDramRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">CAS# Latency (CL):</span>
                <span className="text-neutral-200 font-semibold">{specs.memory.timings.casLatency} clocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">RAS# to CAS# Delay (tRCD):</span>
                <span className="text-neutral-200">{specs.memory.timings.rasToCas} clocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">RAS# Precharge (tRP):</span>
                <span className="text-neutral-200">{specs.memory.timings.rasPrecharge} clocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cycle Time (tRAS):</span>
                <span className="text-neutral-200">{specs.memory.timings.cycleTime} clocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Command Rate (CR):</span>
                <span className="text-neutral-200 font-semibold">{specs.memory.timings.commandRate}</span>
              </div>
            </fieldset>
          </div>
        )}

        {/* TAB 4: Graphics */}
        {activeTab === 'Graphics' && (
          <div className="space-y-3 font-mono text-[11px]">
            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">GPU Specification</legend>
              <div className="flex">
                <span className="w-28 text-neutral-400">Name:</span>
                <span className="font-semibold text-white truncate">{specs.gpu.name}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Vendor:</span>
                <span className="text-neutral-200">{specs.gpu.vendor}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Architecture:</span>
                <span className="text-neutral-200">{specs.gpu.architecture}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Technology:</span>
                <span className="text-neutral-200">{specs.gpu.technology}</span>
                <span className="ml-auto text-neutral-400 mr-2">TDP:</span>
                <span className="text-neutral-200 font-semibold">{specs.gpu.tdp} W</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-400">Shading Units:</span>
                <span className="text-cyan-400 font-semibold">{specs.gpu.shadingUnits} Stream / CUDA Cores</span>
              </div>
            </fieldset>

            <fieldset className="border border-neutral-700/80 rounded-lg p-3 bg-neutral-950/40 space-y-2">
              <legend className="px-1.5 text-[11px] font-semibold text-neutral-400">Clocks & VRAM</legend>
              <div className="flex justify-between">
                <span className="text-neutral-400">GPU Core Clock:</span>
                <span className="text-neutral-200">{specs.gpu.coreClock} MHz (Boost: {specs.gpu.boostClock} MHz)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Memory Clock:</span>
                <span className="text-neutral-200">{specs.gpu.memoryClock} MHz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">VRAM Size & Type:</span>
                <span className="text-white font-semibold">{specs.gpu.memorySizeGB} GB {specs.gpu.memoryType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Bus Width & Bandwidth:</span>
                <span className="text-neutral-200">{specs.gpu.busWidth}-bit ({specs.gpu.bandwidthGBs} GB/s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Driver Version:</span>
                <span className="text-neutral-300">{specs.gpu.driverVersion}</span>
              </div>
            </fieldset>
          </div>
        )}

        {/* TAB 5: Bench (Classic CPU-Z Bench) */}
        {activeTab === 'Bench' && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRunBench}
                disabled={isBenchmarking}
                className="px-5 py-2 text-xs font-bold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20"
              >
                {isBenchmarking ? 'Calculando Benchmark...' : 'Bench CPU (Testar)'}
              </button>

              <button
                onClick={handleToggleStress}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isStressRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                }`}
              >
                {isStressRunning ? 'Parar Stress CPU' : 'Stress CPU (Loop)'}
              </button>

              <div className="flex items-center gap-2 ml-auto text-xs">
                <span className="text-neutral-400">Referência:</span>
                <select
                  value={referenceCpuId}
                  onChange={(e) => setReferenceCpuId(e.target.value)}
                  className="bg-neutral-950 text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-700 focus:outline-none"
                >
                  {CPU_Z_REFERENCES.map(ref => (
                    <option key={ref.id} value={ref.id}>
                      {ref.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progress bar */}
            {isBenchmarking && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-cyan-400">{benchProgressText}</div>
                <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${benchProgressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stress test live indicators */}
            {isStressRunning && stressStats && (
              <div className="p-3 bg-neutral-950 rounded-lg border border-rose-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Carga Contínua FPU / AVX Ativa ({specs.cpu.threads} Threads)
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{stressStats.powerW} W</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-neutral-900 p-1.5 rounded">
                    <div className="text-neutral-500 text-[10px]">Carga CPU</div>
                    <div className="text-neutral-100 font-bold">{stressStats.load}%</div>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded">
                    <div className="text-neutral-500 text-[10px]">Temperatura</div>
                    <div className={`font-bold ${stressStats.temp > 85 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {stressStats.temp}°C
                    </div>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded">
                    <div className="text-neutral-500 text-[10px]">Thermal Throttle</div>
                    <div className={stressStats.throttled ? 'text-rose-500 font-bold' : 'text-emerald-400'}>
                      {stressStats.throttled ? 'SIM (Reduzindo)' : 'NÃO (Estável)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Benchmark Scores Display (CPU-Z Style Comparison) */}
            <div className="space-y-4 pt-2">
              {/* Single Thread Comparison */}
              <div className="bg-neutral-950/70 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">CPU Single Thread</span>
                  <span className="font-mono text-neutral-400 text-[11px]">Pontuação Normalizada</span>
                </div>

                {/* User CPU Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-cyan-400 font-semibold truncate max-w-[280px]">
                      {specs.cpu.name} (Este Sistema)
                    </span>
                    <span className="text-cyan-400 font-bold text-sm">
                      {benchmarkResult ? benchmarkResult.singleCoreScore : '---'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((benchmarkResult?.singleCoreScore || 0) / 1000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reference CPU Bar */}
                <div className="space-y-1 pt-1 border-t border-neutral-900">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-neutral-400 truncate max-w-[280px]">
                      {selectedRefCpu.name} (Referência)
                    </span>
                    <span className="text-neutral-300 font-semibold">
                      {selectedRefCpu.singleScore}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-neutral-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (selectedRefCpu.singleScore / 1000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Multi Thread Comparison */}
              <div className="bg-neutral-950/70 p-3.5 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">CPU Multi Thread</span>
                  <span className="font-mono text-neutral-400 text-[11px]">Pontuação Normalizada</span>
                </div>

                {/* User CPU Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-emerald-400 font-semibold truncate max-w-[280px]">
                      {specs.cpu.name} ({specs.cpu.threads}T)
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {benchmarkResult ? benchmarkResult.multiCoreScore : '---'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((benchmarkResult?.multiCoreScore || 0) / 18000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reference CPU Bar */}
                <div className="space-y-1 pt-1 border-t border-neutral-900">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-neutral-400 truncate max-w-[280px]">
                      {selectedRefCpu.name} (Referência)
                    </span>
                    <span className="text-neutral-300 font-semibold">
                      {selectedRefCpu.multiScore}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-neutral-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (selectedRefCpu.multiScore / 18000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {benchmarkResult && (
                <div className="text-[11px] text-neutral-400 bg-neutral-950 p-2.5 rounded border border-neutral-800 flex justify-between font-mono">
                  <span>Duração do teste: {benchmarkResult.calculationDurationMs} ms</span>
                  <span>Relação vs Referência: {benchmarkResult.multiRatio}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer CPU-Z style */}
      <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Tools · Validation · HW-Bench Pro</span>
        <button
          onClick={() => setActiveTab('Bench')}
          className="text-cyan-400 hover:underline cursor-pointer"
        >
          Executar Benchmark
        </button>
      </div>
    </div>
  );
};
