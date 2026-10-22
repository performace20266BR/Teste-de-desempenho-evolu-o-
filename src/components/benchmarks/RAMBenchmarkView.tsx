import React, { useState } from 'react';
import { SystemSpecs, RAMBenchmarkResult } from '../../types/hardware';
import { runRAMBenchmark } from '../../utils/benchmarks/ramBenchmark';

interface RAMBenchmarkViewProps {
  specs: SystemSpecs;
}

export const RAMBenchmarkView: React.FC<RAMBenchmarkViewProps> = ({ specs }) => {
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [result, setResult] = useState<RAMBenchmarkResult | null>(null);

  const handleRun = async () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setProgressPct(0);

    try {
      const res = await runRAMBenchmark(
        specs.memory.type,
        specs.memory.dramFrequency,
        (step, pct) => {
          setProgressText(step);
          setProgressPct(pct);
        }
      );
      setResult(res);
    } finally {
      setIsBenchmarking(false);
      setProgressText('');
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block"></span>
            Benchmark de Memória RAM & Hierarquia de Cache (AIDA64 Style)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Mede a largura de banda real (GB/s) de Leitura, Escrita, Cópia e a latência de acesso em nanossegundos (ns).
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isBenchmarking}
          className="px-5 py-2 text-xs font-bold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20"
        >
          {isBenchmarking ? 'Executando Benchmark...' : 'Iniciar Teste de RAM'}
        </button>
      </div>

      {/* Progress */}
      {isBenchmarking && (
        <div className="space-y-1.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="text-xs font-mono text-cyan-400">{progressText}</div>
          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* RAM Specs & Timings Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">Tipo & Capacidade</div>
          <div className="text-neutral-100 font-bold mt-1">{specs.memory.sizeGB} GB {specs.memory.type}</div>
        </div>
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">Frequência</div>
          <div className="text-cyan-400 font-bold mt-1">{specs.memory.dramFrequency * 2} MT/s ({specs.memory.dramFrequency} MHz)</div>
        </div>
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">Canais de Memória</div>
          <div className="text-neutral-100 font-bold mt-1">{specs.memory.channel}</div>
        </div>
        <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">Timings Primários</div>
          <div className="text-emerald-400 font-bold mt-1">CL{specs.memory.timings.casLatency}-{specs.memory.timings.rasToCas}-{specs.memory.timings.rasPrecharge}</div>
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Read Speed */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="text-xs text-neutral-400 font-semibold">Leitura de Memória (Read)</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {result ? result.readSpeedGBs : '---'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">GB/s</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Taxa sequencial de transferência</div>
        </div>

        {/* Write Speed */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="text-xs text-neutral-400 font-semibold">Escrita de Memória (Write)</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {result ? result.writeSpeedGBs : '---'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">GB/s</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Throughput de escrita direta</div>
        </div>

        {/* Copy Speed */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="text-xs text-neutral-400 font-semibold">Cópia de Memória (Copy)</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-purple-400">
              {result ? result.copySpeedGBs : '---'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">GB/s</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Transferência buffer-to-buffer</div>
        </div>

        {/* Latency */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
          <div className="text-xs text-neutral-400 font-semibold">Latência de Acesso (Latency)</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {result ? result.latencyNs : '---'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">ns</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Pointer chasing (menor é melhor)</div>
        </div>
      </div>

      {/* Cache Hierarchy Bandwidth (L1, L2, L3 vs DRAM) */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300 uppercase tracking-wider">
            Hierarquia de Cache da CPU vs DRAM
          </span>
          <span className="font-mono text-neutral-500 text-[11px]">Velocidade Teórica e Estimada</span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          {/* L1 Cache */}
          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>L1 Cache (Instrução & Dados)</span>
              <span className="text-cyan-400 font-bold">{result ? `${result.l1SpeedGBs} GB/s` : '~2,400 GB/s'}</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* L2 Cache */}
          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>L2 Cache (Dedicado por Core)</span>
              <span className="text-emerald-400 font-bold">{result ? `${result.l2SpeedGBs} GB/s` : '~1,200 GB/s'}</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '52%' }} />
            </div>
          </div>

          {/* L3 Cache */}
          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>L3 Cache (Compartilhado / 3D V-Cache)</span>
              <span className="text-purple-400 font-bold">{result ? `${result.l3SpeedGBs} GB/s` : '~550 GB/s'}</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: '25%' }} />
            </div>
          </div>

          {/* System DRAM */}
          <div>
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>Memória RAM do Sistema (DRAM)</span>
              <span className="text-amber-400 font-bold">{result ? `${result.readSpeedGBs} GB/s` : '~85 GB/s'}</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '6%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
