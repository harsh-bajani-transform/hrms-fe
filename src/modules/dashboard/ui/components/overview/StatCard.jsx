import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtext,
  icon,
  trend = 'neutral', // 'up' | 'down' | 'neutral'
  className = '',
  tooltip = ''
}) => {
  const CardIcon = icon;
  return (
    <div 
      className={`
        relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 
        transition-all duration-300 hover:shadow-md hover:border-blue-100 group
        ${className}
      `}
      title={tooltip}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <CardIcon className="w-24 h-24 text-blue-600" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
            <CardIcon className="w-6 h-6 text-blue-600" />
          </div>
          
          {trend !== 'neutral' && (
            <div className={`
              flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full
              ${trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
              }
            `}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{subtext.replace(/[^0-9.%+-]/g, '')}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
          
          {trend === 'neutral' && subtext && (
            <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1.5">
              <Minus className="w-3 h-3" />
              {subtext}
            </p>
          )}

          {trend !== 'neutral' && (
             <p className="text-xs text-slate-400 mt-2 font-medium">
               vs previous period
             </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
