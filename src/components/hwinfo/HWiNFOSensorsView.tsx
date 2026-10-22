import React, { useState } from 'react';
import { SensorData, SystemSpecs } from '../../types/hardware';

interface HWiNFOSensorsViewProps {
  sensors: SensorData[];
  specs: SystemSpecs;
  onResetMinMax: () => void;
}

export const HWiNFOSensorsView: React.FC<HWiNFOSensorsViewProps> = ({
  sensors,
  specs,
  onResetMinMax,
}) => {
  const [filterText, setFilterText] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    CPU: true,
    GPU: true,
    Memory: true,
    Motherboard: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const filteredSensors = sensors.filter(s =>
    s.name.toLowerCase().includes(filterText.toLowerCase()) ||
    s.category.toLowerCase().includes(filterText.toLowerCase())
  );

  const categories = ['CPU', 'GPU', 'Memory', 'Motherboard'] as const;

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Bar styled like HWiNFO64 Sensors Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-neutral-100">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block"></span>
            HWiNFO64 v8.10 - Sensor Status
          </div>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400 font-mono text-[11px] truncate max-w-[200px]">
            {specs.cpu.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Search */}
          <input
            type="text"
            placeholder="Filtrar sensor (ex: temp, clock)..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-xs px-2.5 py-1 rounded text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-400 w-44"
          />

          {/* Reset Min/Max Button */}
          <button
            onClick={onResetMinMax}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded border border-neutral-700 transition-colors whitespace-nowrap cursor-pointer"
            title="Zerar valores Mínimo, Máximo e Média"
          >
            Resetar Min/Max
          </button>
        </div>
      </div>

      {/* Sensor Table */}
      <div className="overflow-x-auto max-h-[520px] divide-y divide-neutral-800 font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-neutral-950/90 sticky top-0 z-10 text-[11px] text-neutral-400 select-none shadow-sm">
            <tr>
              <th className="py-2 px-3 font-semibold w-1/3">Sensor</th>
              <th className="py-2 px-3 text-right font-semibold">Atual</th>
              <th className="py-2 px-3 text-right font-semibold text-neutral-500">Mínimo</th>
              <th className="py-2 px-3 text-right font-semibold text-neutral-500">Máximo</th>
              <th className="py-2 px-3 text-right font-semibold text-neutral-500">Média</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {categories.map(cat => {
              const catSensors = filteredSensors.filter(s => s.category === cat);
              if (catSensors.length === 0) return null;
              const isExpanded = expandedCategories[cat] !== false;

              let catTitle = '';
              if (cat === 'CPU') catTitle = `CPU [#0]: ${specs.cpu.name}`;
              else if (cat === 'GPU') catTitle = `GPU [#0]: ${specs.gpu.name}`;
              else if (cat === 'Memory') catTitle = `System Memory: ${specs.memory.sizeGB}GB ${specs.memory.type}`;
              else catTitle = `Motherboard: ${specs.motherboard.model}`;

              return (
                <React.Fragment key={cat}>
                  {/* Category Header Row */}
                  <tr
                    onClick={() => toggleCategory(cat)}
                    className="bg-neutral-950/80 hover:bg-neutral-800/60 cursor-pointer select-none font-sans"
                  >
                    <td colSpan={5} className="py-1.5 px-3 font-bold text-neutral-300 text-[11px] flex items-center gap-2">
                      <span className="text-cyan-400 text-[10px]">
                        {isExpanded ? '▼' : '►'}
                      </span>
                      <span>{catTitle}</span>
                    </td>
                  </tr>

                  {/* Sensor Rows */}
                  {isExpanded && catSensors.map(sensor => {
                    const isHot = sensor.isWarning;

                    return (
                      <tr
                        key={sensor.id}
                        className={`hover:bg-neutral-800/40 transition-colors ${
                          isHot ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="py-1.5 px-3 text-neutral-300 truncate max-w-[220px]">
                          <span className="pl-2 flex items-center gap-1.5">
                            {isHot && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
                            <span className={isHot ? 'text-rose-300 font-semibold' : ''}>
                              {sensor.name}
                            </span>
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold tabular-nums">
                          <span className={isHot ? 'text-rose-400' : 'text-neutral-100'}>
                            {sensor.current} <span className="text-[10px] text-neutral-500 font-normal">{sensor.unit}</span>
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right text-neutral-400 tabular-nums">
                          {sensor.min} <span className="text-[10px] text-neutral-600 font-normal">{sensor.unit}</span>
                        </td>
                        <td className="py-1.5 px-3 text-right text-neutral-400 tabular-nums">
                          {sensor.max} <span className="text-[10px] text-neutral-600 font-normal">{sensor.unit}</span>
                        </td>
                        <td className="py-1.5 px-3 text-right text-neutral-400 tabular-nums">
                          {sensor.avg} <span className="text-[10px] text-neutral-600 font-normal">{sensor.unit}</span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Monitoramento em Tempo Real Ativo</span>
        </div>
        <span>Taxa de Polling: 500ms</span>
      </div>
    </div>
  );
};
