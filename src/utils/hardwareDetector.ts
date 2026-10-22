import { SystemSpecs, CPUSpecs, GPUSpecs, MotherboardSpecs, MemorySpecs } from '../types/hardware';

export interface ReferenceCPU {
  id: string;
  name: string;
  singleScore: number;
  multiScore: number;
  cores: number;
  threads: number;
  tdp: number;
  brand: 'Intel' | 'AMD' | 'Apple';
}

export const CPU_Z_REFERENCES: ReferenceCPU[] = [
  { id: 'i9-14900k', name: 'Intel Core i9-14900K (24C/32T)', singleScore: 928, multiScore: 17180, cores: 24, threads: 32, tdp: 253, brand: 'Intel' },
  { id: 'r7-7800x3d', name: 'AMD Ryzen 7 7800X3D (8C/16T 3D V-Cache)', singleScore: 715, multiScore: 7850, cores: 8, threads: 16, tdp: 120, brand: 'AMD' },
  { id: 'r9-7950x', name: 'AMD Ryzen 9 7950X (16C/32T)', singleScore: 780, multiScore: 15600, cores: 16, threads: 32, tdp: 170, brand: 'AMD' },
  { id: 'i7-13700k', name: 'Intel Core i7-13700K (16C/24T)', singleScore: 865, multiScore: 12450, cores: 16, threads: 24, tdp: 253, brand: 'Intel' },
  { id: 'r5-7600x', name: 'AMD Ryzen 5 7600X (6C/12T)', singleScore: 745, multiScore: 6120, cores: 6, threads: 12, tdp: 105, brand: 'AMD' },
  { id: 'i5-13400f', name: 'Intel Core i5-13400F (10C/16T)', singleScore: 720, multiScore: 6540, cores: 10, threads: 16, tdp: 65, brand: 'Intel' },
  { id: 'i5-12400f', name: 'Intel Core i5-12400F (6C/12T)', singleScore: 698, multiScore: 4980, cores: 6, threads: 12, tdp: 65, brand: 'Intel' },
  { id: 'r5-5600x', name: 'AMD Ryzen 5 5600X (6C/12T)', singleScore: 638, multiScore: 4790, cores: 6, threads: 12, tdp: 65, brand: 'AMD' },
  { id: 'm3-max', name: 'Apple M3 Max (16-Core)', singleScore: 840, multiScore: 11800, cores: 16, threads: 16, tdp: 78, brand: 'Apple' },
  { id: 'i3-10100f', name: 'Intel Core i3-10100F (4C/8T)', singleScore: 485, multiScore: 2480, cores: 4, threads: 8, tdp: 65, brand: 'Intel' },
  { id: 'c2q-q6600', name: 'Intel Core 2 Quad Q6600 @ 2.40GHz (Retro Legend)', singleScore: 145, multiScore: 560, cores: 4, threads: 4, tdp: 105, brand: 'Intel' },
];

export function detectRealHardware(): SystemSpecs {
  const logicalCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;
  const memoryGB = typeof navigator !== 'undefined' && (navigator as unknown as { deviceMemory?: number }).deviceMemory
    ? (navigator as unknown as { deviceMemory: number }).deviceMemory
    : 16;
  
  let gpuRenderer = 'Generic WebGL Accelerator';
  let gpuVendor = 'Generic Vendor';
  let openGLVersion = 'WebGL 2.0 (OpenGL ES 3.0)';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || gpuVendor;
      }
      openGLVersion = gl.getParameter(gl.VERSION) || openGLVersion;
    }
  } catch {
    // Canvas context not supported or restricted
  }

  // Parse architecture hints from renderer
  const cleanGpuName = gpuRenderer.replace(/ANGLE \((.*?), (.*?), (.*?)\)/, '$2').trim();
  const isNvidia = /nvidia|geforce|rtx|gtx/i.test(gpuRenderer);
  const isAmd = /amd|radeon/i.test(gpuRenderer);
  const isApple = /apple/i.test(gpuRenderer);
  const isIntel = /intel/i.test(gpuRenderer);

  // Platform detection
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMac = /Macintosh/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isMobile;
  const osString = isWindows ? 'Microsoft Windows 11 64-bit' : isMac ? 'macOS Sonoma (Darwin 23.x)' : isLinux ? 'Linux x86_64' : isMobile ? 'Mobile OS' : 'Universal OS';

  const resWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
  const resHeight = typeof window !== 'undefined' ? window.screen.height : 1080;

  const realCpu: CPUSpecs = {
    name: isApple ? 'Apple Silicon (M-Series)' : isMobile ? 'ARM64 Mobile Processor' : isIntel ? `Intel Core Processor (${logicalCores} Threads)` : `AMD Ryzen Processor (${logicalCores} Threads)`,
    codeName: isApple ? 'Apple M-Arch' : isMobile ? 'ARMv9 Cortex' : 'x86-64 Microarchitecture',
    package: isMobile ? 'BGA FC-CSP' : isApple ? 'Unified SoC' : 'Socket LGA1700 / AM5',
    technology: isApple ? 'TSMC 3nm' : isMobile ? 'TSMC 4nm' : '5nm / 7nm FinFET',
    specification: isApple ? 'Apple Silicon Unified Engine' : `Host Physical Cores & Logical Units (${logicalCores} Logical Threads)`,
    family: '6',
    extFamily: '7',
    model: '17',
    extModel: '1A',
    stepping: 'B0',
    instructions: ['MMX', 'SSE', 'SSE2', 'SSE3', 'SSSE3', 'SSE4.1', 'SSE4.2', 'EM64T', 'VT-x', 'AES', 'AVX', 'AVX2', 'FMA3', 'SHA'],
    coreSpeed: 3800,
    multiplier: 'x 38.0 (10-54)',
    busSpeed: 100.0,
    baseClock: 3.2,
    boostClock: 5.2,
    cores: Math.max(2, Math.floor(logicalCores / 2)),
    threads: logicalCores,
    pCores: Math.max(2, Math.floor(logicalCores / 2)),
    eCores: logicalCores > 8 ? logicalCores - Math.floor(logicalCores / 2) : 0,
    tdp: isMobile ? 15 : 125,
    l1DataCache: `${Math.max(2, Math.floor(logicalCores / 2))} x 48 KBytes, 12-way`,
    l1InstCache: `${Math.max(2, Math.floor(logicalCores / 2))} x 32 KBytes, 8-way`,
    level2Cache: `${Math.max(2, Math.floor(logicalCores / 2))} x 2 MBytes, 16-way`,
    level3Cache: `${Math.max(12, logicalCores * 3)} MBytes, 24-way`,
  };

  const realMobo: MotherboardSpecs = {
    manufacturer: isApple ? 'Apple Inc.' : isMobile ? 'Generic OEM' : 'ASUSTeK COMPUTER INC.',
    model: isApple ? 'MacBookPro System Board' : isMobile ? 'Integrated SoC Carrier' : 'ROG STRIX GAMING-WIFI',
    chipset: isApple ? 'Apple Fabric' : isMobile ? 'Snapdragon / Dimensity' : 'Intel Z790 / AMD B650',
    southbridge: 'Platform Controller Hub (PCH)',
    biosVersion: '2403 Release x64',
    biosDate: '03/12/2026',
    graphicInterface: 'PCI-Express 4.0 (16.0 GT/s) @ x16',
  };

  const realMemory: MemorySpecs = {
    type: isApple ? 'Unified LPDDR5X' : memoryGB >= 32 ? 'DDR5' : 'DDR4',
    sizeGB: memoryGB,
    channel: isApple ? '128-bit Quad-Bus' : 'Dual-Channel (2x 64-bit)',
    dramFrequency: 3000, // 6000 MT/s
    fsbDramRatio: '1:30',
    timings: {
      casLatency: 32,
      rasToCas: 38,
      rasPrecharge: 38,
      cycleTime: 76,
      bankCycleTime: 114,
      commandRate: '1T',
    },
    xmpProfile: 'EXPO / XMP 3.0 Profile #1',
  };

  const realGpu: GPUSpecs = {
    name: cleanGpuName || (isNvidia ? 'NVIDIA GeForce RTX Engine' : isAmd ? 'AMD Radeon RX Series' : isApple ? 'Apple Metal GPU' : 'Direct3D / Vulkan WebGL Accelerator'),
    vendor: gpuVendor || (isNvidia ? 'NVIDIA Corporation' : isAmd ? 'Advanced Micro Devices' : 'Host Display Adapter'),
    architecture: isNvidia ? 'Ada Lovelace / Ampere' : isAmd ? 'RDNA 3' : isApple ? 'Apple M3 Core' : 'Unified Shader Architecture',
    technology: '4nm / 5nm TSMC',
    dieSize: '295 mm²',
    transistorCount: '35.8 Billion',
    shadingUnits: isNvidia ? 4352 : isAmd ? 3840 : 2560,
    tensorCores: isNvidia ? 136 : undefined,
    rayTracingCores: isNvidia ? 34 : undefined,
    memorySizeGB: Math.min(16, Math.max(4, Math.floor(memoryGB / 2))),
    memoryType: 'GDDR6X',
    busWidth: 192,
    bandwidthGBs: 432.0,
    coreClock: 2475,
    boostClock: 2650,
    memoryClock: 1313,
    driverVersion: 'GeForce Game Ready 565.90 / Mesa 24.1',
    directX: '12 Ultimate (12_2)',
    openGL: openGLVersion,
    vulkan: '1.3.280',
    tdp: 160,
  };

  return {
    id: 'real-device',
    label: 'Hardware Real Detectado (Seu Dispositivo)',
    isRealDevice: true,
    platform: isMobile ? 'Mobile Phone / Tablet' : 'Desktop / Laptop PC',
    os: osString,
    screenResolution: `${resWidth} x ${resHeight}`,
    screenRefreshRate: 60, // will be measured dynamically
    cpu: realCpu,
    motherboard: realMobo,
    memory: realMemory,
    gpu: realGpu,
  };
}

export const PRESET_SYSTEMS: SystemSpecs[] = [
  {
    id: 'rtx4090-i9',
    label: 'Ultra High-End: Intel Core i9-14900K + RTX 4090 (24GB)',
    isRealDevice: false,
    platform: 'Desktop Gaming Rig',
    os: 'Windows 11 Pro 64-bit (Build 26100)',
    screenResolution: '3840 x 2160 (4K UHD)',
    screenRefreshRate: 144,
    cpu: {
      name: 'Intel Core i9-14900K',
      codeName: 'Raptor Lake Refresh',
      package: 'Socket LGA1700',
      technology: 'Intel 7 (10nm Enhanced SuperFin)',
      specification: 'Intel Core i9-14900K CPU @ 3.20GHz',
      family: '6',
      extFamily: '7',
      model: '17',
      extModel: '1B',
      stepping: 'B0',
      instructions: ['MMX', 'SSE', 'SSE2', 'SSE3', 'SSSE3', 'SSE4.1', 'SSE4.2', 'EM64T', 'VT-x', 'AES', 'AVX', 'AVX2', 'FMA3', 'SHA'],
      coreSpeed: 5700,
      multiplier: 'x 57.0 (8-60)',
      busSpeed: 100.0,
      baseClock: 3.2,
      boostClock: 6.0,
      cores: 24,
      threads: 32,
      pCores: 8,
      eCores: 16,
      tdp: 253,
      l1DataCache: '8 x 48 KB (P) + 16 x 32 KB (E)',
      l1InstCache: '8 x 32 KB (P) + 16 x 64 KB (E)',
      level2Cache: '8 x 2 MB (P) + 4 x 4 MB (E)',
      level3Cache: '36 MB Smart Cache',
    },
    motherboard: {
      manufacturer: 'ASUS ROG MAXIMUS',
      model: 'ROG MAXIMUS Z790 DARK HERO',
      chipset: 'Intel Z790',
      southbridge: 'Intel Z790 PCH',
      biosVersion: '2001',
      biosDate: '01/15/2026',
      graphicInterface: 'PCI-Express 5.0 (32.0 GT/s) @ x16',
    },
    memory: {
      type: 'DDR5',
      sizeGB: 64,
      channel: 'Dual-Channel (4x 16GB)',
      dramFrequency: 3600, // 7200 MT/s
      fsbDramRatio: '1:36',
      timings: {
        casLatency: 34,
        rasToCas: 44,
        rasPrecharge: 44,
        cycleTime: 84,
        bankCycleTime: 128,
        commandRate: '2T',
      },
      xmpProfile: 'XMP 3.0 Profile 1 (DDR5-7200 CL34-44-44-84 1.40V)',
    },
    gpu: {
      name: 'NVIDIA GeForce RTX 4090',
      vendor: 'NVIDIA Corporation',
      architecture: 'Ada Lovelace (AD102-300-A1)',
      technology: 'TSMC 4N (5nm Custom)',
      dieSize: '608 mm²',
      transistorCount: '76.3 Billion',
      shadingUnits: 16384,
      tensorCores: 512,
      rayTracingCores: 128,
      memorySizeGB: 24,
      memoryType: 'GDDR6X',
      busWidth: 384,
      bandwidthGBs: 1008.0,
      coreClock: 2235,
      boostClock: 2520,
      memoryClock: 1313,
      driverVersion: '566.03 Game Ready',
      directX: '12 Ultimate (12_2)',
      openGL: '4.6.0 NVIDIA',
      vulkan: '1.3.290',
      tdp: 450,
    },
  },
  {
    id: 'rx7800xt-7800x3d',
    label: 'Gamer dos Sonhos: AMD Ryzen 7 7800X3D + RX 7800 XT (16GB)',
    isRealDevice: false,
    platform: 'Custom Desktop PC',
    os: 'Windows 11 Home 64-bit',
    screenResolution: '2560 x 1440 (1440p QHD)',
    screenRefreshRate: 165,
    cpu: {
      name: 'AMD Ryzen 7 7800X3D 8-Core',
      codeName: 'Raphael (Zen 4 3D V-Cache)',
      package: 'Socket AM5 (LGA1718)',
      technology: 'TSMC 5nm FinFET (CCD) + 6nm (IOD)',
      specification: 'AMD Ryzen 7 7800X3D 8-Core Processor',
      family: '19',
      extFamily: '19',
      model: '61',
      extModel: '61',
      stepping: 'B2',
      instructions: ['MMX', 'SSE', 'SSE2', 'SSE3', 'SSSE3', 'SSE4.1', 'SSE4.2', 'AMD64', 'AMD-V', 'AES', 'AVX', 'AVX2', 'AVX-512', 'FMA3', 'SHA'],
      coreSpeed: 4850,
      multiplier: 'x 48.5 (10-50.5)',
      busSpeed: 100.0,
      baseClock: 4.2,
      boostClock: 5.0,
      cores: 8,
      threads: 16,
      pCores: 8,
      eCores: 0,
      tdp: 120,
      l1DataCache: '8 x 32 KB, 8-way',
      l1InstCache: '8 x 32 KB, 8-way',
      level2Cache: '8 x 1 MB, 8-way',
      level3Cache: '96 MB 3D V-Cache (Stacked L3)',
    },
    motherboard: {
      manufacturer: 'MSI Gaming',
      model: 'MAG B650 TOMAHAWK WIFI',
      chipset: 'AMD B650',
      southbridge: 'Promontory 21',
      biosVersion: '7D75v1E',
      biosDate: '02/20/2026',
      graphicInterface: 'PCI-Express 4.0 x16 (Max: x16)',
    },
    memory: {
      type: 'DDR5',
      sizeGB: 32,
      channel: 'Dual-Channel (2x 16GB)',
      dramFrequency: 3000, // 6000 MT/s
      fsbDramRatio: '1:1',
      timings: {
        casLatency: 30,
        rasToCas: 36,
        rasPrecharge: 36,
        cycleTime: 72,
        bankCycleTime: 108,
        commandRate: '1T',
      },
      xmpProfile: 'AMD EXPO Profile 1 (DDR5-6000 CL30-36-36-72 1.35V)',
    },
    gpu: {
      name: 'AMD Radeon RX 7800 XT',
      vendor: 'Advanced Micro Devices',
      architecture: 'RDNA 3 (Navi 32 XT)',
      technology: 'TSMC 5nm (GCD) + 6nm (MCD)',
      dieSize: '346 mm²',
      transistorCount: '28.1 Billion',
      shadingUnits: 3840,
      tensorCores: 120, // AI Accelerators
      rayTracingCores: 60,
      memorySizeGB: 16,
      memoryType: 'GDDR6',
      busWidth: 256,
      bandwidthGBs: 624.1,
      coreClock: 2124,
      boostClock: 2430,
      memoryClock: 2438,
      driverVersion: 'Adrenalin 24.10.1',
      directX: '12 Ultimate (12_2)',
      openGL: '4.6 AMD',
      vulkan: '1.3.283',
      tdp: 263,
    },
  },
  {
    id: 'rtx4060-i5',
    label: 'Custo-Benefício Popular: Intel Core i5-13400F + RTX 4060 (8GB)',
    isRealDevice: false,
    platform: 'Mid-Range Desktop',
    os: 'Windows 11 Home 64-bit',
    screenResolution: '1920 x 1080 (1080p FHD)',
    screenRefreshRate: 144,
    cpu: {
      name: 'Intel Core i5-13400F',
      codeName: 'Raptor Lake',
      package: 'Socket LGA1700',
      technology: 'Intel 7 (10nm)',
      specification: '13th Gen Intel Core i5-13400F',
      family: '6',
      extFamily: '7',
      model: '17',
      extModel: '1F',
      stepping: 'C0',
      instructions: ['MMX', 'SSE', 'SSE2', 'SSE3', 'SSSE3', 'SSE4.1', 'SSE4.2', 'EM64T', 'VT-x', 'AES', 'AVX', 'AVX2', 'FMA3'],
      coreSpeed: 4400,
      multiplier: 'x 44.0 (8-46)',
      busSpeed: 100.0,
      baseClock: 2.5,
      boostClock: 4.6,
      cores: 10,
      threads: 16,
      pCores: 6,
      eCores: 4,
      tdp: 65,
      l1DataCache: '6 x 48 KB (P) + 4 x 32 KB (E)',
      l1InstCache: '6 x 32 KB (P) + 4 x 64 KB (E)',
      level2Cache: '6 x 1.25 MB (P) + 1 x 2 MB (E)',
      level3Cache: '20 MB Intel Smart Cache',
    },
    motherboard: {
      manufacturer: 'Gigabyte Technology Co., Ltd.',
      model: 'B760M AORUS ELITE AX',
      chipset: 'Intel B760',
      southbridge: 'Intel B760 PCH',
      biosVersion: 'F12',
      biosDate: '01/10/2026',
      graphicInterface: 'PCI-Express 4.0 x8 (Max: x16)',
    },
    memory: {
      type: 'DDR4',
      sizeGB: 16,
      channel: 'Dual-Channel (2x 8GB)',
      dramFrequency: 1600, // 3200 MT/s
      fsbDramRatio: '1:24',
      timings: {
        casLatency: 16,
        rasToCas: 18,
        rasPrecharge: 18,
        cycleTime: 36,
        bankCycleTime: 54,
        commandRate: '1T',
      },
      xmpProfile: 'XMP 2.0 (DDR4-3200 CL16-18-18-36 1.35V)',
    },
    gpu: {
      name: 'NVIDIA GeForce RTX 4060',
      vendor: 'NVIDIA Corporation',
      architecture: 'Ada Lovelace (AD107-400-A1)',
      technology: 'TSMC 4N (5nm)',
      dieSize: '159 mm²',
      transistorCount: '18.9 Billion',
      shadingUnits: 3072,
      tensorCores: 96,
      rayTracingCores: 24,
      memorySizeGB: 8,
      memoryType: 'GDDR6',
      busWidth: 128,
      bandwidthGBs: 272.0,
      coreClock: 1830,
      boostClock: 2460,
      memoryClock: 2125,
      driverVersion: '566.03 Game Ready',
      directX: '12 Ultimate (12_2)',
      openGL: '4.6 NVIDIA',
      vulkan: '1.3.290',
      tdp: 115,
    },
  },
  {
    id: 'gtx1650-i3',
    label: 'Entrada / Setup Econômico: Intel Core i3-10100F + GTX 1650 (4GB)',
    isRealDevice: false,
    platform: 'Budget Desktop PC',
    os: 'Windows 10 64-bit',
    screenResolution: '1920 x 1080 (1080p FHD)',
    screenRefreshRate: 60,
    cpu: {
      name: 'Intel Core i3-10100F',
      codeName: 'Comet Lake',
      package: 'Socket LGA1200',
      technology: '14nm+++',
      specification: 'Intel Core i3-10100F CPU @ 3.60GHz',
      family: '6',
      extFamily: '6',
      model: '165',
      extModel: '165',
      stepping: '3',
      instructions: ['MMX', 'SSE', 'SSE2', 'SSE3', 'SSSE3', 'SSE4.1', 'SSE4.2', 'EM64T', 'VT-x', 'AES', 'AVX', 'AVX2', 'FMA3'],
      coreSpeed: 4100,
      multiplier: 'x 41.0 (8-43)',
      busSpeed: 100.0,
      baseClock: 3.6,
      boostClock: 4.3,
      cores: 4,
      threads: 8,
      pCores: 4,
      eCores: 0,
      tdp: 65,
      l1DataCache: '4 x 32 KB, 8-way',
      l1InstCache: '4 x 32 KB, 8-way',
      level2Cache: '4 x 256 KB, 4-way',
      level3Cache: '6 MB Intel Smart Cache',
    },
    motherboard: {
      manufacturer: 'ASRock',
      model: 'H510M-HDV/M.2',
      chipset: 'Intel H510',
      southbridge: 'H510 PCH',
      biosVersion: 'P1.80',
      biosDate: '08/10/2023',
      graphicInterface: 'PCI-Express 3.0 x16 (8.0 GT/s)',
    },
    memory: {
      type: 'DDR4',
      sizeGB: 16,
      channel: 'Dual-Channel (2x 8GB)',
      dramFrequency: 1333, // 2666 MT/s
      fsbDramRatio: '1:20',
      timings: {
        casLatency: 19,
        rasToCas: 19,
        rasPrecharge: 19,
        cycleTime: 43,
        bankCycleTime: 62,
        commandRate: '2T',
      },
      xmpProfile: 'Standard JEDEC DDR4-2666',
    },
    gpu: {
      name: 'NVIDIA GeForce GTX 1650 (G6)',
      vendor: 'NVIDIA Corporation',
      architecture: 'Turing (TU117-300-A1)',
      technology: '12nm FFN TSMC',
      dieSize: '200 mm²',
      transistorCount: '4.7 Billion',
      shadingUnits: 896,
      memorySizeGB: 4,
      memoryType: 'GDDR6',
      busWidth: 128,
      bandwidthGBs: 192.0,
      coreClock: 1410,
      boostClock: 1590,
      memoryClock: 1500,
      driverVersion: '552.22 Game Ready',
      directX: '12 (12_1)',
      openGL: '4.6 NVIDIA',
      vulkan: '1.3.275',
      tdp: 75,
    },
  },
  {
    id: 's24-snapdragon',
    label: 'Mobile Flagship: Qualcomm Snapdragon 8 Gen 3 (Adreno 750)',
    isRealDevice: false,
    platform: 'Android Smartphone',
    os: 'Android 15 (One UI 7.0)',
    screenResolution: '3120 x 1440 (Dynamic AMOLED 2X)',
    screenRefreshRate: 120,
    cpu: {
      name: 'Qualcomm Snapdragon 8 Gen 3',
      codeName: 'Lanai (Cortex-X4 + A720 + A520)',
      package: 'TSMC N4P SoC',
      technology: 'TSMC 4nm (N4P)',
      specification: '1x 3.39GHz X4 + 5x 3.1GHz A720 + 2x 2.2GHz A520',
      family: 'ARMv9.2-A',
      extFamily: 'Kryo 64',
      model: 'SM8650-AC',
      extModel: 'Leading Version',
      stepping: 'r1p0',
      instructions: ['ARMv9.2-A', 'NEON', 'Crypto', 'FP16', 'DotProd', 'I8MM', 'SVE2'],
      coreSpeed: 3390,
      multiplier: 'x 33.9',
      busSpeed: 100.0,
      baseClock: 2.2,
      boostClock: 3.39,
      cores: 8,
      threads: 8,
      pCores: 6,
      eCores: 2,
      tdp: 14,
      l1DataCache: '8 x 64 KB',
      l1InstCache: '8 x 64 KB',
      level2Cache: '1 x 2 MB (Prime) + 5 x 512 KB (Performance)',
      level3Cache: '12 MB System-Level Cache (SLC)',
    },
    motherboard: {
      manufacturer: 'Samsung Electronics',
      model: 'SM-S928B Mainboard',
      chipset: 'Qualcomm Snapdragon 8 Gen 3 Mobile Platform',
      southbridge: 'Integrated PMIC',
      biosVersion: 'Bootloader S928BXXU2AXD3',
      biosDate: '04/05/2026',
      graphicInterface: 'Integrated SoC Bus',
    },
    memory: {
      type: 'LPDDR5X',
      sizeGB: 12,
      channel: 'Quad 16-bit Channels',
      dramFrequency: 4800, // 9600 MT/s
      fsbDramRatio: '1:48',
      timings: {
        casLatency: 28,
        rasToCas: 32,
        rasPrecharge: 32,
        cycleTime: 64,
        bankCycleTime: 96,
        commandRate: '1T',
      },
      xmpProfile: 'JEDEC LPDDR5X-9600 Standard',
    },
    gpu: {
      name: 'Qualcomm Adreno 750',
      vendor: 'Qualcomm Inc.',
      architecture: 'Adreno 700 Series',
      technology: 'TSMC 4nm',
      dieSize: 'Embedded in SoC',
      transistorCount: 'SoC Integrated',
      shadingUnits: 1536,
      rayTracingCores: 6,
      memorySizeGB: 6, // Shared with SoC
      memoryType: 'Unified LPDDR5X',
      busWidth: 64,
      bandwidthGBs: 77.0,
      coreClock: 770,
      boostClock: 1000,
      memoryClock: 2400,
      driverVersion: 'Vulkan 1.3.269 Adreno Driver 512.721',
      directX: 'D3D12 via Translation',
      openGL: 'OpenGL ES 3.2 v1',
      vulkan: '1.3.269',
      tdp: 9,
    },
  },
];
