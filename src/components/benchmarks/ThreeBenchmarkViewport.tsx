import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GPUBenchmarkResult, AfterburnerConfig } from '../../types/hardware';
import { MSIAfterburnerOverlay } from '../afterburner/MSIAfterburnerOverlay';

interface ThreeBenchmarkViewportProps {
  mode: 'citadel' | 'kombustor' | 'bottleneck_sim';
  resolutionPreset: '1080p' | '1440p' | '4K';
  targetDurationSeconds?: number;
  onBenchmarkComplete?: (result: GPUBenchmarkResult) => void;
  afterburnerConfig: AfterburnerConfig;
  specsName: string;
  onGpuLoadReport?: (gpuLoad: number, cpuLoad: number, fps: number, frametimeMs: number) => void;
}

export const ThreeBenchmarkViewport: React.FC<ThreeBenchmarkViewportProps> = ({
  mode,
  resolutionPreset,
  targetDurationSeconds = 15,
  onBenchmarkComplete,
  afterburnerConfig,
  specsName,
  onGpuLoadReport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentFps, setCurrentFps] = useState<number>(60);
  const [currentFrametime, setCurrentFrametime] = useState<number>(16.6);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [benchmarkResult, setBenchmarkResult] = useState<GPUBenchmarkResult | null>(null);

  // Bottleneck interactive levers
  const [cpuPhysicsParticles, setCpuPhysicsParticles] = useState<number>(4000);
  const [gpuShadingComplexity, setGpuShadingComplexity] = useState<'Medium' | 'Ultra'>('Ultra');

  // Animation & Metric Tracking refs
  const animationFrameId = useRef<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const benchmarkStartTimeRef = useRef<number>(0);

  const startBenchmark = useCallback(() => {
    setIsRunning(true);
    setBenchmarkResult(null);
    setElapsedTime(0);
    setProgressPercent(0);
    frameTimesRef.current = [];
    benchmarkStartTimeRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
  }, []);

  const stopBenchmark = useCallback(() => {
    setIsRunning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    const fts = frameTimesRef.current;
    if (fts.length === 0) return;

    // Calculate metrics
    const totalDurationSec = (performance.now() - benchmarkStartTimeRef.current) / 1000;
    const totalFrames = fts.length;
    const sumFrametimes = fts.reduce((a, b) => a + b, 0);
    const avgFrametime = sumFrametimes / totalFrames;
    const avgFps = Number((1000 / avgFrametime).toFixed(1));

    // Calculate FPS array
    const fpsArray = fts.map(ft => (ft > 0 ? 1000 / ft : 60)).sort((a, b) => a - b);
    const minFps = Number((fpsArray[0] || 30).toFixed(1));
    const maxFps = Number((fpsArray[fpsArray.length - 1] || 120).toFixed(1));

    // 1% Low (1st percentile of sorted ascending FPS)
    const p1Index = Math.max(0, Math.floor(fpsArray.length * 0.01));
    const onePercentLow = Number((fpsArray[p1Index] || minFps).toFixed(1));

    // 0.1% Low (0.1th percentile of sorted ascending FPS)
    const p01Index = Math.max(0, Math.floor(fpsArray.length * 0.001));
    const pointOnePercentLow = Number((fpsArray[p01Index] || minFps).toFixed(1));

    // Variance calculation
    const variance = fts.reduce((acc, ft) => acc + Math.pow(ft - avgFrametime, 2), 0) / totalFrames;
    const frametimeVarianceMs = Number(Math.sqrt(variance).toFixed(2));

    // Stutter counts (frametime spikes > 2x average)
    const stutters = fts.filter(ft => ft > avgFrametime * 2.2).length;

    const result: GPUBenchmarkResult = {
      sceneName: mode === 'citadel' ? 'Citadel Space Flight Benchmark' : mode === 'kombustor' ? 'MSI Kombustor FurMark Stress' : 'CPU vs GPU Bottleneck Simulation',
      durationSeconds: Number(totalDurationSec.toFixed(1)),
      totalFrames,
      avgFps,
      minFps,
      maxFps,
      onePercentLowFps: onePercentLow,
      pointOnePercentLowFps: pointOnePercentLow,
      frametimeVarianceMs,
      frametimes: fts.slice(-100),
      stutterCount: stutters,
    };

    setBenchmarkResult(result);
    onBenchmarkComplete?.(result);
  }, [mode, onBenchmarkComplete]);

  // Three.js scene setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);
    scene.fog = new THREE.FogExp2(0x06090e, mode === 'citadel' ? 0.008 : 0.02);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 15, 45);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: resolutionPreset !== '4K', // Heavy 4K runs with raw fill rate
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, resolutionPreset === '4K' ? 2 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Common Lighting
    const ambientLight = new THREE.AmbientLight(0x223344, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(20, 50, 30);
    scene.add(dirLight);

    const magentaLight = new THREE.PointLight(0xff0055, 3.5, 80);
    magentaLight.position.set(-20, 20, 10);
    scene.add(magentaLight);

    // Objects specific to mode
    let animateCallback: (time: number) => void = () => {};

    if (mode === 'citadel') {
      // SCENE 1: Futuristic Citadel with instanced skyscrapers, flight path, and particle grid
      const buildingCount = 280;
      const buildingGeo = new THREE.BoxGeometry(3, 1, 3);
      const buildingMat = new THREE.MeshStandardMaterial({
        color: 0x111c2e,
        roughness: 0.2,
        metalness: 0.8,
      });

      const instancedBuildings = new THREE.InstancedMesh(buildingGeo, buildingMat, buildingCount);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < buildingCount; i++) {
        const x = (Math.random() - 0.5) * 160;
        const z = (Math.random() - 0.5) * 200;
        const heightScale = 5 + Math.random() * 45;
        dummy.position.set(x, heightScale / 2, z);
        dummy.scale.set(1 + Math.random() * 1.5, heightScale, 1 + Math.random() * 1.5);
        dummy.updateMatrix();
        instancedBuildings.setMatrixAt(i, dummy.matrix);
      }
      instancedBuildings.instanceMatrix.needsUpdate = true;
      scene.add(instancedBuildings);

      // Floor grid
      const grid = new THREE.GridHelper(240, 60, 0x00e5ff, 0x1e293b);
      grid.position.y = 0.1;
      scene.add(grid);

      // Sky particles
      const particleGeo = new THREE.BufferGeometry();
      const particleCount = 1500;
      const particlePos = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        particlePos[i] = (Math.random() - 0.5) * 200;
        particlePos[i + 1] = Math.random() * 70;
        particlePos[i + 2] = (Math.random() - 0.5) * 200;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.6,
        transparent: true,
        opacity: 0.7,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      animateCallback = (time) => {
        // Dynamic camera flythrough sequence
        const t = time * 0.0004;
        camera.position.x = Math.sin(t * 1.5) * 35;
        camera.position.z = Math.cos(t) * 55;
        camera.position.y = 18 + Math.sin(t * 2) * 8;
        camera.lookAt(0, 8, 0);

        magentaLight.position.x = Math.sin(t * 3) * 30;
        magentaLight.position.z = Math.cos(t * 3) * 30;
      };

    } else if (mode === 'kombustor') {
      // SCENE 2: Procedural Fuzzy Torus Donut (FurMark / Kombustor Stress)
      const torusGroup = new THREE.Group();
      scene.add(torusGroup);

      // Main Torus Core
      const coreGeo = new THREE.TorusGeometry(12, 4.5, 36, 120);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xff3b00,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x551100,
      });
      const coreTorus = new THREE.Mesh(coreGeo, coreMat);
      torusGroup.add(coreTorus);

      // Multi-layer fur shells (concentrically scaled wireframe / instanced torus shells)
      const shellCount = 8;
      for (let s = 1; s <= shellCount; s++) {
        const shellGeo = new THREE.TorusGeometry(12, 4.5 + s * 0.35, 24, 80);
        const shellMat = new THREE.MeshBasicMaterial({
          color: s % 2 === 0 ? 0xff6600 : 0xffaa00,
          wireframe: true,
          transparent: true,
          opacity: 0.25 - (s / shellCount) * 0.15,
        });
        const shellMesh = new THREE.Mesh(shellGeo, shellMat);
        torusGroup.add(shellMesh);
      }

      // Spark particles radiating outward
      const sparkCount = 2000;
      const sparkGeo = new THREE.BufferGeometry();
      const sparkPos = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        const r = 16 + Math.random() * 12;
        sparkPos[i] = r * Math.sin(theta) * Math.cos(phi);
        sparkPos[i + 1] = r * Math.sin(theta) * Math.sin(phi);
        sparkPos[i + 2] = r * Math.cos(theta);
      }
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
      const sparkMat = new THREE.PointsMaterial({
        color: 0xff4500,
        size: 0.8,
        transparent: true,
        opacity: 0.8,
      });
      const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
      torusGroup.add(sparkPoints);

      camera.position.set(0, 0, 36);
      camera.lookAt(0, 0, 0);

      animateCallback = (time) => {
        const t = time * 0.001;
        torusGroup.rotation.x = t * 0.6;
        torusGroup.rotation.y = t * 0.8;
        torusGroup.rotation.z = Math.sin(t * 0.4) * 0.5;

        const pulse = 1 + Math.sin(t * 4) * 0.05;
        torusGroup.scale.set(pulse, pulse, pulse);
      };

    } else {
      // SCENE 3: CPU vs GPU Bottleneck Simulation
      // Heavy CPU physics loop updating particle velocities every frame on JS main thread
      const pCount = cpuPhysicsParticles;
      const particlePos = new Float32Array(pCount * 3);
      const particleVel = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount; i++) {
        particlePos[i * 3] = (Math.random() - 0.5) * 50;
        particlePos[i * 3 + 1] = (Math.random() - 0.5) * 50;
        particlePos[i * 3 + 2] = (Math.random() - 0.5) * 50;

        particleVel[i * 3] = (Math.random() - 0.5) * 0.4;
        particleVel[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
        particleVel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      }

      const simGeo = new THREE.BufferGeometry();
      simGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
      const simMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.9,
        transparent: true,
        opacity: 0.85,
      });
      const simPoints = new THREE.Points(simGeo, simMat);
      scene.add(simPoints);

      // Heavy GPU mesh sphere
      const sphereGeo = new THREE.IcosahedronGeometry(14, gpuShadingComplexity === 'Ultra' ? 6 : 3);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.15,
        wireframe: true,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      scene.add(sphereMesh);

      camera.position.set(0, 0, 42);

      animateCallback = () => {
        // Real CPU Physics Computation per frame!
        // Simulates N-body attraction to center
        const positions = simGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          const idx = i * 3;
          let px = positions[idx];
          let py = positions[idx + 1];
          let pz = positions[idx + 2];

          // Gravity pull to center
          const distSq = px * px + py * py + pz * pz + 1.0;
          const force = -2.5 / distSq;
          particleVel[idx] += px * force * 0.05;
          particleVel[idx + 1] += py * force * 0.05;
          particleVel[idx + 2] += pz * force * 0.05;

          // Drag
          particleVel[idx] *= 0.99;
          particleVel[idx + 1] *= 0.99;
          particleVel[idx + 2] *= 0.99;

          px += particleVel[idx];
          py += particleVel[idx + 1];
          pz += particleVel[idx + 2];

          positions[idx] = px;
          positions[idx + 1] = py;
          positions[idx + 2] = pz;
        }
        simGeo.attributes.position.needsUpdate = true;

        sphereMesh.rotation.y += 0.01;
        sphereMesh.rotation.x += 0.005;
      };
    }

    // Render loop
    const renderLoop = (time: number) => {
      const now = performance.now();
      const ft = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Filter unrealistic anomalies (tab switches)
      const validFt = Math.max(1, Math.min(200, ft));
      const instantFps = 1000 / validFt;

      setCurrentFrametime(Number(validFt.toFixed(1)));
      setCurrentFps(Math.round(instantFps));

      if (isRunning) {
        frameTimesRef.current.push(validFt);
        const elapsedSec = (now - benchmarkStartTimeRef.current) / 1000;
        setElapsedTime(Number(elapsedSec.toFixed(1)));
        const pct = Math.min(100, Math.round((elapsedSec / targetDurationSeconds) * 100));
        setProgressPercent(pct);

        // Report load
        const calculatedGpuLoad = mode === 'kombustor' ? 99 : mode === 'citadel' ? 96 : 88;
        const calculatedCpuLoad = mode === 'bottleneck_sim' ? 85 : 35;
        onGpuLoadReport?.(calculatedGpuLoad, calculatedCpuLoad, Math.round(instantFps), validFt);

        if (elapsedSec >= targetDurationSeconds) {
          stopBenchmark();
          return;
        }
      }

      animateCallback(time);
      renderer.render(scene, camera);

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      renderer.dispose();
    };
  }, [mode, resolutionPreset, isRunning, targetDurationSeconds, cpuPhysicsParticles, gpuShadingComplexity, onGpuLoadReport, stopBenchmark]);

  return (
    <div className="relative w-full h-[460px] md:h-[540px] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-neutral-200">
            {mode === 'citadel' ? 'Citadel Space Benchmark' : mode === 'kombustor' ? 'MSI Kombustor FurMark Stress' : 'Simulador CPU x GPU'}
          </span>
          <span className="text-xs text-neutral-500">·</span>
          <span className="text-xs font-mono text-cyan-400">
            {resolutionPreset}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'bottleneck_sim' && (
            <div className="hidden sm:flex items-center gap-3 text-xs mr-3 text-neutral-400">
              <label className="flex items-center gap-1.5">
                <span>Carga CPU:</span>
                <select
                  value={cpuPhysicsParticles}
                  onChange={(e) => setCpuPhysicsParticles(Number(e.target.value))}
                  className="bg-neutral-800 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-700"
                >
                  <option value={1000}>1K (Leve / Sem Gargalo)</option>
                  <option value={4000}>4K (Médio)</option>
                  <option value={12000}>12K (Pesado / Gargalo Severo)</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span>Malha GPU:</span>
                <select
                  value={gpuShadingComplexity}
                  onChange={(e) => setGpuShadingComplexity(e.target.value as 'Medium' | 'Ultra')}
                  className="bg-neutral-800 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-700"
                >
                  <option value="Medium">Médio</option>
                  <option value="Ultra">Ultra (Subdivisões Altas)</option>
                </select>
              </label>
            </div>
          )}

          {!isRunning ? (
            <button
              onClick={startBenchmark}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20"
            >
              Iniciar Teste ({targetDurationSeconds}s)
            </button>
          ) : (
            <button
              onClick={stopBenchmark}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Interromper ({elapsedTime}s / {targetDurationSeconds}s)
            </button>
          )}
        </div>
      </div>

      {/* Progress Line */}
      {isRunning && (
        <div className="w-full bg-neutral-900 h-1 z-10 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="relative w-full flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* MSI Afterburner On-Screen Display HUD */}
        {afterburnerConfig.showOSD && (
          <MSIAfterburnerOverlay
            config={afterburnerConfig}
            fps={currentFps}
            frametimeMs={currentFrametime}
            gpuName={specsName}
            frametimesHistory={frameTimesRef.current.slice(-60)}
          />
        )}
      </div>

      {/* Benchmark Completed Modal Overlay */}
      {benchmarkResult && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-neutral-100">Resultado do Benchmark 3D</h4>
                <p className="text-xs text-neutral-400">{benchmarkResult.sceneName} · {resolutionPreset}</p>
              </div>
              <button
                onClick={() => setBenchmarkResult(null)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800"
              >
                Fechar
              </button>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-xs text-neutral-400">Média (Avg FPS)</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{benchmarkResult.avgFps}</div>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-xs text-neutral-400">1% Low FPS</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{benchmarkResult.onePercentLowFps}</div>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-xs text-neutral-400">0.1% Low FPS</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">{benchmarkResult.pointOnePercentLowFps}</div>
              </div>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="text-xs text-neutral-400">Desvio Frametime</div>
                <div className="text-xl font-bold font-mono text-neutral-200 mt-1">{benchmarkResult.frametimeVarianceMs} <span className="text-xs text-neutral-500">ms</span></div>
              </div>
            </div>

            <div className="text-xs text-neutral-400 space-y-1.5 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              <div className="flex justify-between">
                <span>Quadros Renderizados:</span>
                <span className="font-mono text-neutral-200">{benchmarkResult.totalFrames} frames</span>
              </div>
              <div className="flex justify-between">
                <span>FPS Mínimo / Máximo:</span>
                <span className="font-mono text-neutral-200">{benchmarkResult.minFps} FPS / {benchmarkResult.maxFps} FPS</span>
              </div>
              <div className="flex justify-between">
                <span>Micro-Engasgos (Stutters):</span>
                <span className={`font-mono ${benchmarkResult.stutterCount > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {benchmarkResult.stutterCount} ocorrências
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={startBenchmark}
                className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Repetir Teste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
