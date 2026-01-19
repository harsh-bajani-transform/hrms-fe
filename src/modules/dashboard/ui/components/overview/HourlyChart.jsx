import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const HourlyChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
        <p className="text-slate-400 text-sm">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Hourly Production</h3>
        <p className="text-sm text-slate-500">Production vs Target per hour</p>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748B', fontSize: 12 }} 
          />
          <Tooltip
            cursor={{ fill: '#F1F5F9' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
          />
          <Bar 
            dataKey="production" 
            name="Production" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          />
          <Bar 
            dataKey="target" 
            name="Target" 
            fill="#E2E8F0" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyChart;
