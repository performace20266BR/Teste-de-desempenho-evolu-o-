export interface CPUSpecs {
  name: string;
  codeName: string;
  package: string;
  technology: string; // e.g. "Intel 7 (10nm)" or "TSMC 5nm"
  specification: string;
  family: string;
  extFamily: string;
  model: string;
  extModel: string;
  stepping: string;
  instructions: string[];
  coreSpeed: number; // in MHz
  multiplier: string;
  busSpeed: number; // in MHz
  baseClock: number; // in GHz
  boostClock: number; // in GHz
  cores: number;
  threads: number;
  pCores?: number;
  eCores?: number;
  tdp: number; // in Watts
  l1DataCache: string;
  l1InstCache: string;
  level2Cache: string;
  level3Cache: string;
}

export interface MotherboardSpecs {
  manufacturer: string;
  model: string;
  chipset: string;
  southbridge: string;
  biosVersion: string;
  biosDate: string;
  graphicInterface: string; // e.g. "PCI-Express 4.0 x16 (Max: x16)"
}

export interface MemorySpecs {
  type: string; // "DDR5" | "DDR4" | "LPDDR5"
  sizeGB: number;
  channel: string; // "Dual", "Quad", "Single"
  dramFrequency: number; // in MHz
  fsbDramRatio: string;
  timings: {
    casLatency: number; // CL
    rasToCas: number; // tRCD
    rasPrecharge: number; // tRP
    cycleTime: number; // tRAS
    bankCycleTime: number; // tRC
    commandRate: string; // 1T / 2T
  };
  xmpProfile: string;
}

export interface GPUSpecs {
  name: string;
  vendor: string;
  architecture: string;
  technology: string;
  dieSize: string;
  transistorCount: string;
  shadingUnits: number; // CUDA / Stream Processors
  tensorCores?: number;
  rayTracingCores?: number;
  memorySizeGB: number;
  memoryType: string; // "GDDR6X" | "GDDR6" | "HBM2"
  busWidth: number; // e.g. 384-bit, 256-bit
  bandwidthGBs: number;
  coreClock: number; // MHz
  boostClock: number; // MHz
  memoryClock: number; // MHz
  driverVersion: string;
  directX: string;
  openGL: string;
  vulkan: string;
  tdp: number; // Watts
}

export interface SystemSpecs {
  id: string;
  label: string;
  isRealDevice: boolean;
  platform: string;
  os: string;
  screenResolution: string;
  screenRefreshRate: number;
  cpu: CPUSpecs;
  motherboard: MotherboardSpecs;
  memory: MemorySpecs;
  gpu: GPUSpecs;
}

export interface SensorData {
  id: string;
  category: 'CPU' | 'GPU' | 'Motherboard' | 'Memory' | 'Power & Thermal';
  name: string;
  current: number;
  min: number;
  max: number;
  avg: number;
  unit: string;
  warningThreshold?: number;
  dangerThreshold?: number;
  isWarning?: boolean;
}

export interface CPUBenchmarkResult {
  singleCoreScore: number;
  multiCoreScore: number;
  singleCoreOps: number;
  multiCoreOps: number;
  calculationDurationMs: number;
  referenceCpuName?: string;
  referenceSingle?: number;
  referenceMulti?: number;
  singleRatio?: number;
  multiRatio?: number;
}

export interface RAMBenchmarkResult {
  readSpeedGBs: number;
  writeSpeedGBs: number;
  copySpeedGBs: number;
  latencyNs: number;
  l1SpeedGBs: number;
  l2SpeedGBs: number;
  l3SpeedGBs: number;
}

export interface GPUBenchmarkResult {
  sceneName: string;
  durationSeconds: number;
  totalFrames: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  onePercentLowFps: number;
  pointOnePercentLowFps: number;
  frametimeVarianceMs: number;
  frametimes: number[]; // last N frametimes in ms
  stutterCount: number;
}

export interface BottleneckReport {
  cpuScore: number;
  gpuScore: number;
  cpuUtilizationAvg: number;
  gpuUtilizationAvg: number;
  bottleneckType: 'CPU_BOTTLENECK' | 'GPU_BOTTLENECK' | 'BALANCED' | 'RAM_BOTTLENECK';
  bottleneckPercentage: number;
  recommendedComponent: string;
  summaryPt: string;
  summaryEn: string;
  detailsPt: string[];
  detailsEn: string[];
  gameEstimates: {
    gameName: string;
    res1080p: number;
    res1440p: number;
    res4K: number;
  }[];
}

export interface AfterburnerConfig {
  showOSD: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  textColor: string; // '#ff5500' | '#00e5ff' | '#00e676' | '#ffffff'
  showGpuStats: boolean;
  showCpuStats: boolean;
  showRamStats: boolean;
  showFrametimeGraph: boolean;
  showFps: boolean;
  powerLimitPercent: number; // 100% default (80 - 120%)
  fanSpeedCurve: number; // Auto or custom %
  coreClockOffset: number; // MHz
}
