import { SensorData, SystemSpecs } from '../types/hardware';

export class TelemetryEngine {
  private sensors: Map<string, SensorData> = new Map();
  private sampleCounts: Map<string, number> = new Map();
  private sumValues: Map<string, number> = new Map();
  private cpuLoadStress: number = 0; // 0 to 100
  private gpuLoadStress: number = 0; // 0 to 100

  constructor(specs: SystemSpecs) {
    this.initSensors(specs);
  }

  public setCpuLoadStress(stress: number) {
    this.cpuLoadStress = Math.max(0, Math.min(100, stress));
  }

  public setGpuLoadStress(stress: number) {
    this.gpuLoadStress = Math.max(0, Math.min(100, stress));
  }

  public initSensors(specs: SystemSpecs) {
    this.sensors.clear();
    this.sampleCounts.clear();
    this.sumValues.clear();

    const tdpCpu = specs.cpu.tdp;
    const tdpGpu = specs.gpu.tdp;

    const baseList: Array<Omit<SensorData, 'min' | 'max' | 'avg'>> = [
      // CPU Sensors
      { id: 'cpu_usage', category: 'CPU', name: 'CPU Total Usage', current: 12.4, unit: '%', warningThreshold: 85, dangerThreshold: 95 },
      { id: 'cpu_temp', category: 'CPU', name: 'CPU Package (Tdie)', current: 42.5, unit: '°C', warningThreshold: 85, dangerThreshold: 95 },
      { id: 'cpu_temp_max', category: 'CPU', name: 'CPU Core Max Temp', current: 44.0, unit: '°C', warningThreshold: 88, dangerThreshold: 98 },
      { id: 'cpu_clock_effective', category: 'CPU', name: 'CPU Core Clock (Effective)', current: specs.cpu.baseClock * 1000, unit: 'MHz' },
      { id: 'cpu_vcore', category: 'CPU', name: 'CPU Vcore Voltage', current: 1.185, unit: 'V', warningThreshold: 1.42, dangerThreshold: 1.48 },
      { id: 'cpu_power', category: 'CPU', name: 'CPU Package Power', current: 28.5, unit: 'W', warningThreshold: tdpCpu * 0.95, dangerThreshold: tdpCpu * 1.1 },

      // GPU Sensors
      { id: 'gpu_usage', category: 'GPU', name: 'GPU Core Load', current: 5.2, unit: '%', warningThreshold: 98, dangerThreshold: 100 },
      { id: 'gpu_temp', category: 'GPU', name: 'GPU Temperature', current: 38.0, unit: '°C', warningThreshold: 82, dangerThreshold: 88 },
      { id: 'gpu_hotspot', category: 'GPU', name: 'GPU Hot Spot Temp', current: 44.2, unit: '°C', warningThreshold: 95, dangerThreshold: 105 },
      { id: 'gpu_clock', category: 'GPU', name: 'GPU Core Clock', current: specs.gpu.coreClock * 0.4, unit: 'MHz' },
      { id: 'gpu_mem_clock', category: 'GPU', name: 'GPU Memory Clock', current: specs.gpu.memoryClock, unit: 'MHz' },
      { id: 'gpu_fan_rpm', category: 'GPU', name: 'GPU Fan Speed (RPM)', current: 950, unit: 'RPM', warningThreshold: 2400, dangerThreshold: 2800 },
      { id: 'gpu_power', category: 'GPU', name: 'GPU Power Draw', current: 22.0, unit: 'W', warningThreshold: tdpGpu * 0.95, dangerThreshold: tdpGpu * 1.05 },
      { id: 'gpu_vram_used', category: 'GPU', name: 'GPU VRAM Allocated', current: 1420, unit: 'MB' },

      // Memory Sensors
      { id: 'ram_used', category: 'Memory', name: 'System Physical Memory Used', current: 5400, unit: 'MB' },
      { id: 'ram_percent', category: 'Memory', name: 'Physical Memory Load', current: 34.0, unit: '%', warningThreshold: 85, dangerThreshold: 95 },
      { id: 'ram_vdimm', category: 'Memory', name: 'DRAM Voltage (VDD)', current: specs.memory.type.includes('DDR5') ? 1.35 : 1.20, unit: 'V' },

      // Motherboard Sensors
      { id: 'mobo_temp', category: 'Motherboard', name: 'Motherboard System Temp', current: 34.0, unit: '°C' },
      { id: 'vrm_temp', category: 'Motherboard', name: 'VRM MOS Temperature', current: 48.0, unit: '°C', warningThreshold: 90, dangerThreshold: 105 },
      { id: 'volt_12v', category: 'Motherboard', name: '+12V Rail Voltage', current: 12.096, unit: 'V' },
      { id: 'volt_5v', category: 'Motherboard', name: '+5V Rail Voltage', current: 5.040, unit: 'V' },
      { id: 'volt_33v', category: 'Motherboard', name: '+3.3V Rail Voltage', current: 3.328, unit: 'V' },
    ];

    baseList.forEach(item => {
      this.sensors.set(item.id, {
        ...item,
        min: item.current,
        max: item.current,
        avg: item.current,
      });
      this.sampleCounts.set(item.id, 1);
      this.sumValues.set(item.id, item.current);
    });
  }

  public update(specs: SystemSpecs, deltaMs: number): SensorData[] {
    const elapsed = deltaMs / 1000;
    const tdpCpu = specs.cpu.tdp;
    const tdpGpu = specs.gpu.tdp;

    // CPU dynamic calculations
    const targetCpuUsage = Math.max(8 + Math.random() * 4, this.cpuLoadStress);
    const targetCpuTemp = 38 + (targetCpuUsage / 100) * (tdpCpu > 150 ? 54 : 38) + Math.sin(Date.now() / 2500) * 1.5;
    const targetCpuPower = 18 + (targetCpuUsage / 100) * (tdpCpu - 18) + (Math.random() - 0.5) * 3;
    const maxClock = specs.cpu.boostClock * 1000;
    const baseClock = specs.cpu.baseClock * 1000;
    const targetCpuClock = targetCpuUsage > 30 ? maxClock - Math.random() * 150 : baseClock + Math.random() * 300;

    // GPU dynamic calculations
    const targetGpuUsage = Math.max(3 + Math.random() * 2, this.gpuLoadStress);
    const targetGpuTemp = 36 + (targetGpuUsage / 100) * 44 + Math.cos(Date.now() / 3000) * 1.2;
    const targetGpuHotspot = targetGpuTemp + 8 + (targetGpuUsage / 100) * 10;
    const targetGpuPower = 15 + (targetGpuUsage / 100) * (tdpGpu - 15) + (Math.random() - 0.5) * 4;
    const targetGpuClock = targetGpuUsage > 25 ? specs.gpu.boostClock : specs.gpu.coreClock * 0.45;
    const targetFanRpm = targetGpuTemp > 50 ? 1100 + ((targetGpuTemp - 50) / 35) * 1600 : 800;

    // VRAM and RAM
    const totalVramMB = specs.gpu.memorySizeGB * 1024;
    const targetVramUsed = 1200 + (targetGpuUsage / 100) * (totalVramMB * 0.65);
    const totalRamMB = specs.memory.sizeGB * 1024;
    const targetRamUsed = 4800 + (targetCpuUsage / 100) * 2200 + (targetGpuUsage / 100) * 1800;
    const targetRamPercent = (targetRamUsed / totalRamMB) * 100;

    // VRM temp
    const targetVrm = 40 + (targetCpuPower / tdpCpu) * 35;

    const sensorTargets: Record<string, number> = {
      cpu_usage: targetCpuUsage,
      cpu_temp: targetCpuTemp,
      cpu_temp_max: targetCpuTemp + 2.5,
      cpu_clock_effective: targetCpuClock,
      cpu_vcore: 1.15 + (targetCpuUsage / 100) * 0.18 + (Math.random() - 0.5) * 0.015,
      cpu_power: targetCpuPower,

      gpu_usage: targetGpuUsage,
      gpu_temp: targetGpuTemp,
      gpu_hotspot: targetGpuHotspot,
      gpu_clock: targetGpuClock,
      gpu_mem_clock: specs.gpu.memoryClock,
      gpu_fan_rpm: targetFanRpm,
      gpu_power: targetGpuPower,
      gpu_vram_used: targetVramUsed,

      ram_used: targetRamUsed,
      ram_percent: targetRamPercent,
      ram_vdimm: (this.sensors.get('ram_vdimm')?.current || 1.35) + (Math.random() - 0.5) * 0.002,

      mobo_temp: 33 + Math.sin(Date.now() / 6000) * 1.5,
      vrm_temp: targetVrm,
      volt_12v: 12.096 + (Math.random() - 0.5) * 0.02,
      volt_5v: 5.040 + (Math.random() - 0.5) * 0.01,
      volt_33v: 3.328 + (Math.random() - 0.5) * 0.005,
    };

    const result: SensorData[] = [];

    this.sensors.forEach((sensor, id) => {
      const target = sensorTargets[id] ?? sensor.current;
      // Exponential smoothing filter
      const smoothFactor = Math.min(1.0, elapsed * 2.8);
      let nextVal = sensor.current + (target - sensor.current) * smoothFactor;

      // Rounding precision based on unit
      if (sensor.unit === 'V') {
        nextVal = Number(nextVal.toFixed(3));
      } else if (sensor.unit === '°C' || sensor.unit === '%' || sensor.unit === 'W') {
        nextVal = Number(nextVal.toFixed(1));
      } else {
        nextVal = Math.round(nextVal);
      }

      const minVal = Math.min(sensor.min, nextVal);
      const maxVal = Math.max(sensor.max, nextVal);

      const count = (this.sampleCounts.get(id) || 1) + 1;
      const sum = (this.sumValues.get(id) || sensor.current) + nextVal;
      this.sampleCounts.set(id, count);
      this.sumValues.set(id, sum);
      const avgVal = Number((sum / count).toFixed(sensor.unit === 'V' ? 3 : 1));

      const isWarning = sensor.warningThreshold !== undefined && nextVal >= sensor.warningThreshold;

      const updated: SensorData = {
        ...sensor,
        current: nextVal,
        min: minVal,
        max: maxVal,
        avg: avgVal,
        isWarning,
      };

      this.sensors.set(id, updated);
      result.push(updated);
    });

    return result;
  }

  public resetMinMax() {
    this.sensors.forEach((sensor, id) => {
      sensor.min = sensor.current;
      sensor.max = sensor.current;
      sensor.avg = sensor.current;
      this.sampleCounts.set(id, 1);
      this.sumValues.set(id, sensor.current);
    });
  }
}
