import { BottleneckReport, CPUSpecs, GPUSpecs, MemorySpecs } from '../../types/hardware';

export interface HardwareRankingItem {
  name: string;
  score: number; // Normalized gaming score out of 100
  tier: 'Enthusiast' | 'High-End' | 'Mid-Range' | 'Budget' | 'Entry';
}

export const CPU_DATABASE: HardwareRankingItem[] = [
  { name: 'AMD Ryzen 7 7800X3D', score: 100, tier: 'Enthusiast' },
  { name: 'Intel Core i9-14900K', score: 98, tier: 'Enthusiast' },
  { name: 'AMD Ryzen 9 7950X3D', score: 97, tier: 'Enthusiast' },
  { name: 'Intel Core i7-14700K', score: 95, tier: 'High-End' },
  { name: 'Intel Core i7-13700K', score: 92, tier: 'High-End' },
  { name: 'AMD Ryzen 7 7700X', score: 88, tier: 'High-End' },
  { name: 'AMD Ryzen 5 7600X', score: 85, tier: 'High-End' },
  { name: 'Intel Core i5-13600K', score: 89, tier: 'High-End' },
  { name: 'Intel Core i5-14600K', score: 90, tier: 'High-End' },
  { name: 'AMD Ryzen 7 5800X3D', score: 86, tier: 'High-End' },
  { name: 'Intel Core i5-13400F', score: 72, tier: 'Mid-Range' },
  { name: 'Intel Core i5-12400F', score: 68, tier: 'Mid-Range' },
  { name: 'AMD Ryzen 5 5600X', score: 67, tier: 'Mid-Range' },
  { name: 'AMD Ryzen 5 5600', score: 65, tier: 'Mid-Range' },
  { name: 'Intel Core i7-10700K', score: 60, tier: 'Mid-Range' },
  { name: 'Intel Core i3-12100F', score: 56, tier: 'Budget' },
  { name: 'AMD Ryzen 5 3600', score: 50, tier: 'Budget' },
  { name: 'Intel Core i3-10100F', score: 42, tier: 'Budget' },
  { name: 'AMD Ryzen 3 3200G', score: 30, tier: 'Entry' },
  { name: 'Apple M3 Max', score: 88, tier: 'High-End' },
  { name: 'Snapdragon 8 Gen 3', score: 48, tier: 'Budget' },
];

export const GPU_DATABASE: HardwareRankingItem[] = [
  { name: 'NVIDIA GeForce RTX 4090', score: 100, tier: 'Enthusiast' },
  { name: 'AMD Radeon RX 7900 XTX', score: 88, tier: 'Enthusiast' },
  { name: 'NVIDIA GeForce RTX 4080 Super', score: 86, tier: 'Enthusiast' },
  { name: 'NVIDIA GeForce RTX 4080', score: 83, tier: 'Enthusiast' },
  { name: 'AMD Radeon RX 7900 XT', score: 79, tier: 'High-End' },
  { name: 'NVIDIA GeForce RTX 4070 Ti Super', score: 76, tier: 'High-End' },
  { name: 'NVIDIA GeForce RTX 4070 Super', score: 71, tier: 'High-End' },
  { name: 'AMD Radeon RX 7800 XT', score: 68, tier: 'High-End' },
  { name: 'NVIDIA GeForce RTX 4070', score: 64, tier: 'High-End' },
  { name: 'AMD Radeon RX 7700 XT', score: 58, tier: 'Mid-Range' },
  { name: 'NVIDIA GeForce RTX 4060 Ti', score: 52, tier: 'Mid-Range' },
  { name: 'AMD Radeon RX 6700 XT', score: 49, tier: 'Mid-Range' },
  { name: 'NVIDIA GeForce RTX 3070', score: 51, tier: 'Mid-Range' },
  { name: 'NVIDIA GeForce RTX 4060', score: 44, tier: 'Mid-Range' },
  { name: 'AMD Radeon RX 7600', score: 41, tier: 'Mid-Range' },
  { name: 'NVIDIA GeForce RTX 3060 12GB', score: 36, tier: 'Budget' },
  { name: 'AMD Radeon RX 6600', score: 34, tier: 'Budget' },
  { name: 'NVIDIA GeForce GTX 1660 Super', score: 24, tier: 'Budget' },
  { name: 'NVIDIA GeForce GTX 1650', score: 15, tier: 'Entry' },
  { name: 'AMD Radeon RX 580 8GB', score: 18, tier: 'Entry' },
];

export function calculateBottleneck(
  cpu: CPUSpecs,
  gpu: GPUSpecs,
  memory: MemorySpecs,
  targetResolution: '1080p' | '1440p' | '4K' = '1080p'
): BottleneckReport {
  // Estimate relative CPU power
  let cpuScore = 70;
  const matchedCpu = CPU_DATABASE.find(c => cpu.name.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cpu.name.toLowerCase()));
  if (matchedCpu) {
    cpuScore = matchedCpu.score;
  } else {
    // Heuristic based on cores and boost clock
    cpuScore = Math.min(100, Math.round((cpu.threads * 2.8) + (cpu.boostClock * 10)));
  }

  // Estimate relative GPU power
  let gpuScore = 60;
  const matchedGpu = GPU_DATABASE.find(g => gpu.name.toLowerCase().includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(gpu.name.toLowerCase()));
  if (matchedGpu) {
    gpuScore = matchedGpu.score;
  } else {
    // Heuristic based on shaders and VRAM
    gpuScore = Math.min(100, Math.round((gpu.shadingUnits / 120) + (gpu.memorySizeGB * 2.2)));
  }

  // Weight adjustments based on resolution:
  // At 1080p, CPU load is very prominent (framerate ceiling is high).
  // At 1440p, it's balanced.
  // At 4K, GPU is nearly 80-90% of the limitation.
  let cpuWeight = 1.0;
  let gpuWeight = 1.0;

  if (targetResolution === '1080p') {
    cpuWeight = 1.25;
    gpuWeight = 0.85;
  } else if (targetResolution === '1440p') {
    cpuWeight = 1.0;
    gpuWeight = 1.05;
  } else if (targetResolution === '4K') {
    cpuWeight = 0.65;
    gpuWeight = 1.45;
  }

  // Effective demand scores
  const effectiveCpuDemand = gpuScore * gpuWeight;
  const effectiveGpuDemand = cpuScore * cpuWeight;

  let bottleneckType: BottleneckReport['bottleneckType'] = 'BALANCED';
  let bottleneckPercentage = 0;
  let cpuUtil = 50;
  let gpuUtil = 99;

  // RAM bottleneck check
  const hasRamBottleneck = memory.sizeGB < 16;

  const scoreDiff = effectiveCpuDemand - cpuScore;

  if (hasRamBottleneck) {
    bottleneckType = 'RAM_BOTTLENECK';
    bottleneckPercentage = 22.0;
    cpuUtil = 65;
    gpuUtil = 72;
  } else if (scoreDiff > 12) {
    // GPU is much faster than CPU -> CPU Bottleneck!
    bottleneckType = 'CPU_BOTTLENECK';
    bottleneckPercentage = Math.min(55, Number((((effectiveCpuDemand - cpuScore) / effectiveCpuDemand) * 100).toFixed(1)));
    cpuUtil = 98;
    gpuUtil = Math.max(50, Math.round(100 - bottleneckPercentage));
  } else if (cpuScore - effectiveGpuDemand > 20) {
    // CPU is much faster than GPU -> GPU bound (normal in high-end gaming)
    bottleneckType = 'GPU_BOTTLENECK';
    bottleneckPercentage = Math.min(45, Number((((cpuScore - effectiveGpuDemand) / cpuScore) * 60).toFixed(1)));
    cpuUtil = Math.max(25, Math.round(50 - (bottleneckPercentage * 0.4)));
    gpuUtil = 99;
  } else {
    bottleneckType = 'BALANCED';
    bottleneckPercentage = Number((Math.abs(scoreDiff) * 0.4).toFixed(1));
    cpuUtil = 55;
    gpuUtil = 98;
  }

  // Recommendation string
  let recommended = 'Nenhum upgrade urgente necessário. Sistema bem balanceado.';
  let summaryPt = '';
  let summaryEn = '';
  const detailsPt: string[] = [];
  const detailsEn: string[] = [];

  if (bottleneckType === 'CPU_BOTTLENECK') {
    recommended = `Upgrade de Processador recomendado para extrair 100% da ${gpu.name}. Sugestão: Ryzen 7 7800X3D ou Core i7-14700K.`;
    summaryPt = `Gargalo de CPU Detectado (${bottleneckPercentage}% em ${targetResolution})`;
    summaryEn = `CPU Bottleneck Detected (${bottleneckPercentage}% at ${targetResolution})`;
    detailsPt.push(`A placa de vídeo ${gpu.name} está sendo limitada pelo processador ${cpu.name}.`);
    detailsPt.push(`A GPU opera em cerca de ${gpuUtil}% de uso em vez do potencial máximo (99-100%).`);
    detailsPt.push(`Aumentar a resolução para 1440p ou 4K reduzirá o gargalo do processador.`);
    detailsEn.push(`The GPU ${gpu.name} is being limited by the CPU ${cpu.name}.`);
    detailsEn.push(`GPU usage peaks around ${gpuUtil}% instead of full potential (99-100%).`);
    detailsEn.push(`Increasing resolution to 1440p or 4K will reduce the CPU bottleneck.`);
  } else if (bottleneckType === 'GPU_BOTTLENECK') {
    recommended = `O processador tem folga substancial. Uma placa de vídeo mais potente renderá ganhos diretos em FPS.`;
    summaryPt = `GPU Bound / Gargalo de GPU Normal (${bottleneckPercentage}% em ${targetResolution})`;
    summaryEn = `GPU Bound / Standard GPU Limit (${bottleneckPercentage}% at ${targetResolution})`;
    detailsPt.push(`A GPU está trabalhando a 99-100%, o que é ideal para estabilidade de frametime em jogos.`);
    detailsPt.push(`O processador opera com folga térmica e de uso (~${cpuUtil}%), sem engasgos de frametime.`);
    detailsEn.push(`GPU is operating at 99-100%, ideal for consistent frame pacing in gaming.`);
    detailsEn.push(`CPU has plenty of headroom (~${cpuUtil}% load), eliminating 1% low frame drops.`);
  } else if (bottleneckType === 'RAM_BOTTLENECK') {
    recommended = `Adicionar mais memória RAM (mínimo 16GB ou 32GB Dual Channel) para evitar micro-stutters e swap de disco.`;
    summaryPt = `Gargalo de Memória RAM Detectado (${memory.sizeGB}GB instalado)`;
    summaryEn = `System RAM Bottleneck Detected (${memory.sizeGB}GB installed)`;
    detailsPt.push(`Jogos modernos exigem mais de 12GB de RAM alocada além do sistema operacional.`);
    detailsPt.push(`Memória abaixo de 16GB causa quedas severas nos frametimes de 1% e 0.1% Low.`);
    detailsEn.push(`Modern games require over 12GB of system RAM on top of the OS.`);
    detailsEn.push(`Having under 16GB RAM creates noticeable drops in 1% and 0.1% low frametimes.`);
  } else {
    recommended = `Configuração em perfeita harmonia! Excelente casamento de CPU e GPU.`;
    summaryPt = `Sistema Perfeitamente Balanceado (Gargalo Residual: ${bottleneckPercentage}%)`;
    summaryEn = `Perfectly Balanced Configuration (Residual Bottleneck: ${bottleneckPercentage}%)`;
    detailsPt.push(`Tanto o processador quanto a placa de vídeo atingem suas faixas operacionais ideais.`);
    detailsPt.push(`Aproveitamento de hardware superior a 96% em resolução ${targetResolution}.`);
    detailsEn.push(`Both CPU and GPU reach their optimal operational performance envelopes.`);
    detailsEn.push(`Hardware utilization efficiency exceeds 96% at ${targetResolution}.`);
  }

  // Calculate expected FPS matrix for top competitive and AAA titles
  const baseScale = (gpuScore * 1.5 + cpuScore * 0.7) * (1 - (bottleneckType === 'CPU_BOTTLENECK' ? bottleneckPercentage / 200 : 0));

  const gameEstimates = [
    {
      gameName: 'Counter-Strike 2',
      res1080p: Math.round(baseScale * 2.8),
      res1440p: Math.round(baseScale * 2.1),
      res4K: Math.round(baseScale * 1.3),
    },
    {
      gameName: 'Cyberpunk 2077 (Ultra RT)',
      res1080p: Math.round(baseScale * 0.95),
      res1440p: Math.round(baseScale * 0.68),
      res4K: Math.round(baseScale * 0.38),
    },
    {
      gameName: 'Call of Duty: Warzone',
      res1080p: Math.round(baseScale * 1.6),
      res1440p: Math.round(baseScale * 1.15),
      res4K: Math.round(baseScale * 0.65),
    },
    {
      gameName: 'Black Myth: Wukong',
      res1080p: Math.round(baseScale * 0.88),
      res1440p: Math.round(baseScale * 0.62),
      res4K: Math.round(baseScale * 0.35),
    },
    {
      gameName: 'Grand Theft Auto V',
      res1080p: Math.round(baseScale * 1.95),
      res1440p: Math.round(baseScale * 1.45),
      res4K: Math.round(baseScale * 0.92),
    },
    {
      gameName: 'Valorant (Competitive)',
      res1080p: Math.round(baseScale * 3.8),
      res1440p: Math.round(baseScale * 3.1),
      res4K: Math.round(baseScale * 2.1),
    },
  ];

  return {
    cpuScore,
    gpuScore,
    cpuUtilizationAvg: cpuUtil,
    gpuUtilizationAvg: gpuUtil,
    bottleneckType,
    bottleneckPercentage,
    recommendedComponent: recommended,
    summaryPt,
    summaryEn,
    detailsPt,
    detailsEn,
    gameEstimates,
  };
}
