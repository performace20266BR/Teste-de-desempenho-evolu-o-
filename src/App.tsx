import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SystemSpecs, SensorData, AfterburnerConfig, GPUBenchmarkResult, CPUBenchmarkResult } from './types/hardware';
import { detectRealHardware, PRESET_SYSTEMS } from './utils/hardwareDetector';
import { TelemetryEngine } from './utils/telemetryEngine';
import { CPUZView } from './components/cpuz/CPUZView';
import { HWiNFOSensorsView } from './components/hwinfo/HWiNFOSensorsView';
import { AfterburnerPanel } from './components/afterburner/AfterburnerPanel';
import { ThreeBenchmarkViewport } from './components/benchmarks/ThreeBenchmarkViewport';
import { BottleneckBenchView } from './components/benchmarks/BottleneckBenchView';
import { RAMBenchmarkView } from './components/benchmarks/RAMBenchmarkView';

export default function App() {
  // Navigation section
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'cpuz' | 'hwinfo' | 'afterburner' | 'bottleneck' | 'ram'>('benchmarks');

  // Hardware specs selection (Real detected by default)
  const initialSpecs = useMemo(() => detectRealHardware(), []);
  const [currentSpecs, setCurrentSpecs] = useState<SystemSpecs>(initialSpecs);

  // 3D Benchmark controls
  const [bench3DMode, setBench3DMode] = useState<'citadel' | 'kombustor' | 'bottleneck_sim'>('citadel');
  const [bench3DResolution, setBench3DResolution] = useState<'1080p' | '1440p' | '4K'>('1080p');
  const [recordedFrametimes, setRecordedFrametimes] = useState<number[]>([]);

  // MSI Afterburner config
  const [afterburnerConfig, setAfterburnerConfig] = useState<AfterburnerConfig>({
    showOSD: true,
    position: 'top-left',
    textColor: '#ff5500',
    showGpuStats: true,
    showCpuStats: true,
    showRamStats: true,
    showFrametimeGraph: true,
    showFps: true,
    powerLimitPercent: 100,
    fanSpeedCurve: 55,
    coreClockOffset: 0,
  });

  // Telemetry Engine instance
  const telemetryEngineRef = useRef<TelemetryEngine | null>(null);
  const [liveSensors, setLiveSensors] = useState<SensorData[]>([]);

  // Initialize and tick telemetry engine
  useEffect(() => {
    const engine = new TelemetryEngine(currentSpecs);
    telemetryEngineRef.current = engine;
    setLiveSensors(engine.update(currentSpecs, 500));

    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;

      if (telemetryEngineRef.current) {
        const updated = telemetryEngineRef.current.update(currentSpecs, delta);
        setLiveSensors([...updated]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentSpecs]);

  // Handle hardware switch
  const handleSelectHardwarePreset = (presetId: string) => {
    if (presetId === 'real-device') {
      setCurrentSpecs(initialSpecs);
    } else {
      const found = PRESET_SYSTEMS.find(p => p.id === presetId);
      if (found) setCurrentSpecs(found);
    }
  };

  // Reset Min/Max in HWiNFO
  const handleResetTelemetryMinMax = () => {
    telemetryEngineRef.current?.resetMinMax();
    if (telemetryEngineRef.current) {
      setLiveSensors([...telemetryEngineRef.current.update(currentSpecs, 100)]);
    }
  };

  // 3D benchmark load callback
  const handleGpuLoadReport = (gpuLoad: number, cpuLoad: number, fps: number, frametimeMs: number) => {
    telemetryEngineRef.current?.setGpuLoadStress(gpuLoad);
    telemetryEngineRef.current?.setCpuLoadStress(cpuLoad);
    setRecordedFrametimes(prev => [...prev.slice(-300), frametimeMs]);
  };

  const handleBenchmarkComplete = (result: GPUBenchmarkResult) => {
    telemetryEngineRef.current?.setGpuLoadStress(5);
    telemetryEngineRef.current?.setCpuLoadStress(10);
    setRecordedFrametimes(result.frametimes);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Single text element wordmark
        Zone 2: 4-5 concise single-line nav links
        Zone 3: 1 primary action (Hardware Profile Selector)
      */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            HW-Bench <span className="text-cyan-400 font-bold">Pro</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            CPU-Z · HWiNFO · Afterburner
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'benchmarks' ? 'text-cyan-400 font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            Benchmarks 3D
          </button>

          <button
            onClick={() => setActiveTab('cpuz')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'cpuz' ? 'text-cyan-400 font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            CPU-Z
          </button>

          <button
            onClick={() => setActiveTab('hwinfo')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'hwinfo' ? 'text-cyan-400 font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            HWiNFO Sensores
          </button>

          <button
            onClick={() => setActiveTab('afterburner')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'afterburner' ? 'text-cyan-400 font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            MSI Afterburner OSD
          </button>

          <button
            onClick={() => setActiveTab('bottleneck')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'bottleneck' ? 'text-cyan-400 font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            Gargalo CPU x GPU
          </button>

          <button
            onClick={() => setActiveTab('ram')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ram' ? 'text-cyan-400 font-semibold' : 'hover:text-neutral-200'
            }`}
          >
            RAM & Cache
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Hardware Profile Picker) */}
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={currentSpecs.id}
            onChange={(e) => handleSelectHardwarePreset(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 border border-neutral-700 rounded-lg hover:border-neutral-500 transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:border-cyan-400 max-w-[200px] sm:max-w-xs truncate"
          >
            <option value="real-device">Seu PC Real (Detectado)</option>
            {PRESET_SYSTEMS.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-2 px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800 text-xs">
        {[
          { id: 'benchmarks', label: 'Benchmarks 3D' },
          { id: 'cpuz', label: 'CPU-Z' },
          { id: 'hwinfo', label: 'HWiNFO' },
          { id: 'afterburner', label: 'Afterburner' },
          { id: 'bottleneck', label: 'Gargalo' },
          { id: 'ram', label: 'RAM' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as typeof activeTab)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === item.id ? 'bg-cyan-500 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Hardware Header Strip */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-neutral-400 block text-[11px]">Processador</span>
              <strong className="text-neutral-100 font-mono truncate max-w-[220px] inline-block">
                {currentSpecs.cpu.name}
              </strong>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Placa de Vídeo</span>
              <strong className="text-cyan-400 font-mono truncate max-w-[220px] inline-block">
                {currentSpecs.gpu.name}
              </strong>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Memória RAM</span>
              <strong className="text-neutral-100 font-mono">
                {currentSpecs.memory.sizeGB}GB {currentSpecs.memory.type} ({currentSpecs.memory.channel})
              </strong>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Resolução & Tela</span>
              <strong className="text-neutral-100 font-mono">
                {currentSpecs.screenResolution} @ {currentSpecs.screenRefreshRate}Hz
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">
              {currentSpecs.isRealDevice ? 'Hardware Real' : 'Simulação Pré-Configurada'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </section>

        {/* TAB 1: 3D Benchmarks (Citadel, FurMark Kombustor, Bottleneck Sim) */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            {/* Benchmark Scene Selector Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Cenário 3D:</span>
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                  <button
                    onClick={() => setBench3DMode('citadel')}
                    className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      bench3DMode === 'citadel' ? 'bg-cyan-500 text-neutral-950 font-semibold' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Citadel Flight (Jogo AAA)
                  </button>

                  <button
                    onClick={() => setBench3DMode('kombustor')}
                    className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      bench3DMode === 'kombustor' ? 'bg-orange-500 text-neutral-950 font-semibold' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Kombustor FurMark (Stress GPU)
                  </button>

                  <button
                    onClick={() => setBench3DMode('bottleneck_sim')}
                    className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      bench3DMode === 'bottleneck_sim' ? 'bg-purple-500 text-neutral-950 font-semibold' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Teste de Gargalo (Física CPU x GPU)
                  </button>
                </div>
              </div>

              {/* Resolution selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Resolução:</span>
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                  {(['1080p', '1440p', '4K'] as const).map(res => (
                    <button
                      key={res}
                      onClick={() => setBench3DResolution(res)}
                      className={`px-2.5 py-1 font-semibold rounded transition-colors ${
                        bench3DResolution === res ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3D Viewport with Live MSI Afterburner HUD */}
            <ThreeBenchmarkViewport
              mode={bench3DMode}
              resolutionPreset={bench3DResolution}
              targetDurationSeconds={15}
              afterburnerConfig={afterburnerConfig}
              specsName={currentSpecs.gpu.name}
              onGpuLoadReport={handleGpuLoadReport}
              onBenchmarkComplete={handleBenchmarkComplete}
            />

            {/* Benchmark Explanation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <h4 className="font-bold text-neutral-200 mb-1">Métricas de Frametime & 1% Low</h4>
                <p className="text-neutral-400 leading-relaxed">
                  Não basta olhar apenas para a média de FPS. O HW-Bench Pro calcula a estabilidade de cada quadro individual e aponta os 1% e 0.1% Lows, cruciais para identificar travadas e micro-engasgos em jogos competitivos.
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <h4 className="font-bold text-neutral-200 mb-1">MSI Afterburner Integrado</h4>
                <p className="text-neutral-400 leading-relaxed">
                  O monitor em tela (HUD) desenha as taxas de quadros em tempo real diretamente sobre o renderizador 3D, com suporte a personalização de cores, posições e controle de curva de fan.
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <h4 className="font-bold text-neutral-200 mb-1">Multiplataforma (PC & Mobile)</h4>
                <p className="text-neutral-400 leading-relaxed">
                  Roda perfeitamente em navegadores desktop com aceleração de hardware e também em dispositivos móveis Android / iOS, detectando instruções e núcleos de silício integrados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CPU-Z View */}
        {activeTab === 'cpuz' && (
          <div className="space-y-6">
            <CPUZView
              specs={currentSpecs}
              onBenchmarkScoreGenerated={(res) => {
                console.log('CPU Score:', res);
              }}
            />
          </div>
        )}

        {/* TAB 3: HWiNFO View */}
        {activeTab === 'hwinfo' && (
          <div className="space-y-6">
            <HWiNFOSensorsView
              sensors={liveSensors}
              specs={currentSpecs}
              onResetMinMax={handleResetTelemetryMinMax}
            />
          </div>
        )}

        {/* TAB 4: MSI Afterburner & RTSS Panel */}
        {activeTab === 'afterburner' && (
          <div className="space-y-6">
            <AfterburnerPanel
              config={afterburnerConfig}
              onChangeConfig={setAfterburnerConfig}
              recordedFrametimes={recordedFrametimes}
            />
          </div>
        )}

        {/* TAB 5: Bottleneck Benchmark View */}
        {activeTab === 'bottleneck' && (
          <div className="space-y-6">
            <BottleneckBenchView
              specs={currentSpecs}
              onLaunchLiveSimulation={() => {
                setBench3DMode('bottleneck_sim');
                setActiveTab('benchmarks');
              }}
            />
          </div>
        )}

        {/* TAB 6: RAM & Cache Benchmark */}
        {activeTab === 'ram' && (
          <div className="space-y-6">
            <RAMBenchmarkView specs={currentSpecs} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6 px-6 text-center text-xs text-neutral-500 bg-neutral-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">HW-Bench Pro</span>
            <span>·</span>
            <span>Suíte Completa de Diagnóstico e Benchmarks de Hardware</span>
          </div>
          <div>
            Inspirado no CPU-Z, HWiNFO64 e MSI Afterburner RTSS
          </div>
        </div>
      </footer>
    </div>
  );
}
