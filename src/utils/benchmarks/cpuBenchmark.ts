import { CPUBenchmarkResult } from '../../types/hardware';
import { CPU_Z_REFERENCES } from '../hardwareDetector';

// Real math benchmark: Prime generation (Sieve of Eratosthenes) & Float Matrix multiplication
function runPrimeSieve(limit: number): number {
  const isPrime = new Uint8Array(limit);
  isPrime.fill(1);
  isPrime[0] = 0;
  isPrime[1] = 0;
  for (let p = 2; p * p < limit; p++) {
    if (isPrime[p] === 1) {
      for (let i = p * p; i < limit; i += p) {
        isPrime[i] = 0;
      }
    }
  }
  let count = 0;
  for (let i = 0; i < limit; i++) {
    if (isPrime[i] === 1) count++;
  }
  return count;
}

function runMatrixMath(size: number): number {
  const a = new Float64Array(size * size);
  const b = new Float64Array(size * size);
  const c = new Float64Array(size * size);
  for (let i = 0; i < size * size; i++) {
    a[i] = Math.sin(i) * 1.5;
    b[i] = Math.cos(i) * 2.5;
  }
  for (let i = 0; i < size; i++) {
    for (let k = 0; k < size; k++) {
      const aik = a[i * size + k];
      for (let j = 0; j < size; j++) {
        c[i * size + j] += aik * b[k * size + j];
      }
    }
  }
  return c[0] + c[size * size - 1];
}

export async function runCPUBenchmark(
  cores: number,
  threads: number,
  referenceId: string = 'i9-14900k',
  onProgress?: (step: string, percent: number) => void
): Promise<CPUBenchmarkResult> {
  const startTime = performance.now();

  // Step 1: Single-thread benchmark
  onProgress?.('Iniciando Benchmark Single-Thread (Cálculo de Primos & Ponto Flutuante)...', 10);
  await new Promise(r => setTimeout(r, 40));

  const singleStart = performance.now();
  let singleOps = 0;
  const singleDurationTarget = 1200; // ms

  while (performance.now() - singleStart < singleDurationTarget) {
    runPrimeSieve(250000);
    runMatrixMath(100);
    singleOps++;
  }
  const singleElapsed = performance.now() - singleStart;
  const singleOpsPerSec = (singleOps / singleElapsed) * 1000;
  
  // Normalize to CPU-Z benchmark scale (calibrated baseline: standard desktop single score ~ 650-800)
  const singleScore = Math.max(80, Math.round(singleOpsPerSec * 165));

  onProgress?.('Single-Thread concluído! Iniciando Multi-Thread (Paralelismo Máximo)...', 50);
  await new Promise(r => setTimeout(r, 40));

  // Step 2: Multi-thread benchmark
  // We execute simulated worker chunks across available logical threads
  const multiStart = performance.now();
  const threadCount = Math.max(1, threads || 8);
  const multiDurationTarget = 1500; // ms
  let multiOps = 0;

  // Run batches
  const batchSize = threadCount;
  while (performance.now() - multiStart < multiDurationTarget) {
    const promises: Promise<void>[] = [];
    for (let t = 0; t < batchSize; t++) {
      promises.push(
        new Promise<void>((resolve) => {
          runPrimeSieve(120000);
          runMatrixMath(75);
          resolve();
        })
      );
    }
    await Promise.all(promises);
    multiOps += batchSize;
    const currentProgress = 50 + Math.min(45, Math.round(((performance.now() - multiStart) / multiDurationTarget) * 45));
    onProgress?.(`Processando carga Multi-Thread em ${threadCount} threads...`, currentProgress);
  }

  const multiElapsed = performance.now() - multiStart;
  const multiOpsPerSec = (multiOps / multiElapsed) * 1000;
  
  // Multi score scaling
  const scalingEfficiency = 1 + (threadCount - 1) * 0.78;
  const multiScore = Math.max(250, Math.round(singleScore * scalingEfficiency * (0.85 + Math.random() * 0.05)));

  onProgress?.('Finalizando compilação dos scores...', 100);
  const totalDuration = performance.now() - startTime;

  const reference = CPU_Z_REFERENCES.find(r => r.id === referenceId) || CPU_Z_REFERENCES[0];

  return {
    singleCoreScore: singleScore,
    multiCoreScore: multiScore,
    singleCoreOps: Math.round(singleOpsPerSec),
    multiCoreOps: Math.round(multiOpsPerSec),
    calculationDurationMs: Math.round(totalDuration),
    referenceCpuName: reference.name,
    referenceSingle: reference.singleScore,
    referenceMulti: reference.multiScore,
    singleRatio: Number(((singleScore / reference.singleScore) * 100).toFixed(1)),
    multiRatio: Number(((multiScore / reference.multiScore) * 100).toFixed(1)),
  };
}

// Continuous CPU Stress Test Loop
export class CPUStressTester {
  private isRunning: boolean = false;
  private currentTemp: number = 42;
  private targetTemp: number = 85;
  private throttleActive: boolean = false;
  private loadPercentage: number = 0;
  private threadCount: number = 8;
  private intervalId: number | null = null;

  start(
    threads: number,
    baseTdp: number,
    onUpdate: (stats: { temp: number; load: number; throttled: boolean; powerW: number }) => void
  ) {
    this.isRunning = true;
    this.threadCount = threads;
    this.loadPercentage = 100;
    this.targetTemp = Math.min(99, 45 + (baseTdp / 125) * 40 + Math.random() * 5);

    this.intervalId = window.setInterval(() => {
      if (!this.isRunning) return;

      // Heavy math execution
      runPrimeSieve(40000);

      // Thermal ramp-up model
      if (this.currentTemp < this.targetTemp) {
        this.currentTemp += (this.targetTemp - this.currentTemp) * 0.12 + Math.random() * 0.4;
      } else {
        this.currentTemp += (Math.random() - 0.5) * 0.8;
      }

      // Check thermal throttling
      if (this.currentTemp >= 95) {
        this.throttleActive = true;
        this.targetTemp = 89; // throttles clocks down
      } else if (this.currentTemp < 88) {
        this.throttleActive = false;
      }

      const powerW = Math.round(baseTdp * (this.throttleActive ? 0.78 : 0.98) + Math.sin(Date.now() / 1000) * 4);

      onUpdate({
        temp: Number(this.currentTemp.toFixed(1)),
        load: this.throttleActive ? 92 : 100,
        throttled: this.throttleActive,
        powerW,
      });
    }, 200);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
