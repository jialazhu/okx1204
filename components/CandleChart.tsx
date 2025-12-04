
import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, CartesianGrid, Line, Cell } from 'recharts';
import { CandleData } from '../types';

interface Props {
  data: CandleData[];
}

// 辅助函数：计算移动平均线
const calculateMA = (data: any[], period: number) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].c; // 使用收盘价计算
    }
    result.push(sum / period);
  }
  return result;
};

const CandleChart: React.FC<Props> = ({ data }) => {
  // 1. 数据预处理与指标计算
  const chartData = useMemo(() => {
    const processed = data.map(d => ({
      timeRaw: parseInt(d.ts),
      time: new Date(parseInt(d.ts)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      o: parseFloat(d.o),
      h: parseFloat(d.h),
      l: parseFloat(d.l),
      c: parseFloat(d.c),
      vol: parseFloat(d.vol),
    }));

    // 计算均线
    const ma7 = calculateMA(processed, 7);
    const ma25 = calculateMA(processed, 25);

    return processed.map((item, i) => ({
      ...item,
      ma7: ma7[i],
      ma25: ma25[i],
      // 用于判断涨跌颜色
      isUp: item.c >= item.o
    }));
  }, [data]);

  // 2. 计算 Y 轴范围 (避免 K 线顶天立地)
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const lows = chartData.map(d => d.l);
    const highs = chartData.map(d => d.h);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.1; // 10% padding
    return [min - padding, max + padding];
  }, [chartData]);

  // 3. 自定义 K 线形状组件
  const CandleStickShape = (props: any) => {
    const { x, width, payload, yAxis } = props;
    // 确保 yAxis 存在且有 scale 函数
    if (!yAxis || !yAxis.scale) return null;

    const scale = yAxis.scale;
    const open = scale(payload.o);
    const close = scale(payload.c);
    const high = scale(payload.h);
    const low = scale(payload.l);
    
    const isUp = payload.c >= payload.o;
    const color = isUp ? '#10b981' : '#ef4444'; // 绿涨红跌 (Crypto 标准)
    // 实体高度至少 1px
    const bodyHeight = Math.max(Math.abs(open - close), 1);
    const bodyY = Math.min(open, close);

    // 计算中心 X 坐标
    const centerX = x + width / 2;

    return (
      <g>
        {/* 上下影线 (Line) */}
        <line x1={centerX} y1={high} x2={centerX} y2={low} stroke={color} strokeWidth={1} />
        {/* 实体 (Rect) */}
        <rect 
          x={x} 
          y={bodyY} 
          width={width} 
          height={bodyHeight} 
          fill={color} 
          stroke={color} // 防止边缘锯齿
        />
      </g>
    );
  };

  return (
    <div className="w-full h-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
          
          <XAxis 
            dataKey="time" 
            stroke="#52525b" 
            tick={{fontSize: 10, fill: '#71717a'}} 
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          
          {/* 主价格轴 (右侧) */}
          <YAxis 
            domain={yDomain} 
            orientation="right" 
            stroke="#52525b" 
            tick={{fontSize: 10, fill: '#71717a'}}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.toFixed(1)}
            width={50}
          />

          {/* 成交量轴 (左侧隐藏，用于控制 Volume 高度) */}
          <YAxis 
            yAxisId="volume" 
            orientation="left" 
            domain={[0, (dataMax: number) => dataMax * 4]} 
            hide 
          />

          <Tooltip 
            contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px'}}
            itemStyle={{padding: 0}}
            formatter={(value: any, name: string, props: any) => {
                if (name === 'ma7') return [value?.toFixed(2), 'MA7'];
                if (name === 'ma25') return [value?.toFixed(2), 'MA25'];
                if (name === 'vol') return [parseInt(value).toLocaleString(), 'Vol'];
                // K线数据在 tooltip 中通常显示 OHLC，Recharts 默认 tooltip 较难完美定制所有字段
                // 这里只显示收盘价作为 Price
                if (name === 'High') return [value, 'Price']; 
                return [value, name];
            }}
            labelStyle={{color: '#a1a1aa', marginBottom: '4px'}}
            labelFormatter={(label) => `${label}`}
            // 自定义 Tooltip 内容以显示 OHLC
            content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                        <div className="bg-okx-card border border-okx-border p-2 rounded shadow-xl text-xs">
                            <div className="text-gray-400 mb-1">{label}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className="text-gray-400">Open:</span>
                                <span className={data.isUp ? 'text-okx-up' : 'text-okx-down'}>{data.o}</span>
                                <span className="text-gray-400">High:</span>
                                <span className={data.isUp ? 'text-okx-up' : 'text-okx-down'}>{data.h}</span>
                                <span className="text-gray-400">Low:</span>
                                <span className={data.isUp ? 'text-okx-up' : 'text-okx-down'}>{data.l}</span>
                                <span className="text-gray-400">Close:</span>
                                <span className={data.isUp ? 'text-okx-up' : 'text-okx-down'}>{data.c}</span>
                                <span className="text-gray-400 mt-1">Vol:</span>
                                <span className="text-gray-200 mt-1">{parseInt(data.vol).toLocaleString()}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-700 flex gap-3">
                                <div className="text-yellow-400">MA7: {data.ma7?.toFixed(2)}</div>
                                <div className="text-purple-400">MA25: {data.ma25?.toFixed(2)}</div>
                            </div>
                        </div>
                    );
                }
                return null;
            }}
          />

          {/* 成交量 (Volume) */}
          <Bar 
            dataKey="vol" 
            yAxisId="volume" 
            barSize={4}
          >
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isUp ? '#10b981' : '#ef4444'} opacity={0.3} />
             ))}
          </Bar>

          {/* K线 (Candlestick) - 使用 dataKey="h" 仅仅是为了让 Y轴 domain 包含最高价 */}
          <Bar 
            dataKey="h" 
            shape={(props: any) => <CandleStickShape {...props} />} 
            isAnimationActive={false}
          />

          {/* 均线 (MA) */}
          <Line type="monotone" dataKey="ma7" stroke="#facc15" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="ma25" stroke="#a855f7" strokeWidth={1} dot={false} isAnimationActive={false} />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandleChart;