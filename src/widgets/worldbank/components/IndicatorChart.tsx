import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import { WorldBankDataPoint } from '../../../services/worldBankApi';
import { COLOR, TYPE, BORDER } from '../../../ds';

interface Props {
  data: WorldBankDataPoint[];
  chartType?: 'line' | 'area';
}

const COLORS = [
    '#FF7722', // Info/Orange
    '#00d084', // Up/Green
    '#ff3b57', // Down/Red
    '#b06aff', // Purple
    '#3388aa', // Cyan
    '#f5a623', // Warning/Gold
    '#FFFFFF', // Primary/White
];

export const IndicatorChart: React.FC<Props> = ({ data, chartType = 'line' }) => {
  const { chartData, regions } = useMemo(() => {
    const regionMap = new Map<string, any>();
    const allYears = new Set<string>();
    
    data.forEach(d => {
        if (isNaN(Number(d.OBS_VALUE))) return;
        allYears.add(d.TIME_PERIOD);
        
        const year = d.TIME_PERIOD;
        if (!regionMap.has(year)) {
            regionMap.set(year, { year });
        }
        regionMap.get(year)[d.REF_AREA] = Number(parseFloat(d.OBS_VALUE).toFixed(2));
    });

    const sortedYears = Array.from(allYears).sort((a, b) => Number(a) - Number(b));
    const finalData = sortedYears.map(year => regionMap.get(year));
    const activeRegions = Array.from(new Set(data.map(d => d.REF_AREA)));

    return { chartData: finalData, regions: activeRegions };
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLOR.text.muted, fontFamily: TYPE.family.mono, fontSize: TYPE.size.sm }}>
        NO_CHART_DATA_FOR_SELECTION
      </div>
    );
  }

  const isMulti = regions.length > 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'area' && !isMulti ? (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.border} vertical={false} />
          <XAxis dataKey="year" stroke={COLOR.text.muted} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} stroke={COLOR.text.muted} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
          <Tooltip 
            contentStyle={{ backgroundColor: COLOR.bg.elevated, border: BORDER.standard, borderRadius: '4px', fontFamily: TYPE.family.mono, fontSize: '11px' }}
            itemStyle={{ color: COLOR.text.primary }}
          />
          <Area type="monotone" dataKey={regions[0]} stroke={COLORS[0]} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      ) : (
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLOR.bg.border} vertical={false} />
          <XAxis dataKey="year" stroke={COLOR.text.muted} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} stroke={COLOR.text.muted} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
          <Tooltip 
            contentStyle={{ backgroundColor: COLOR.bg.elevated, border: BORDER.standard, borderRadius: '4px', fontFamily: TYPE.family.mono, fontSize: '11px' }}
            itemStyle={{ color: COLOR.text.primary }}
          />
          {isMulti && <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontFamily: TYPE.family.mono }} />}
          {regions.map((r, i) => (
            <Line 
                key={r}
                type="monotone" 
                dataKey={r} 
                name={r}
                stroke={COLORS[i % COLORS.length]} 
                strokeWidth={isMulti ? 2 : 2.5} 
                dot={false} 
                activeDot={{ r: 4 }} 
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};
