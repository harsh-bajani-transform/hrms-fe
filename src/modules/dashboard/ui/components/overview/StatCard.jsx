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
        relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-slate-100 
        transition-all duration-300 hover:shadow-md hover:border-blue-100 group
        ${className}
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <CardIcon className="w-20 h-20 text-blue-600" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
            <CardIcon className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex items-center gap-2">
            {trend !== 'neutral' && subtext && (
              <div className={`
                flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                ${trend === 'up' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
                }
              `}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{subtext.replace(/[^0-9.%+-]/g, '')}</span>
              </div>
            )}
            
            {tooltip && (
              <div className="relative group/tooltip shrink-0">
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] leading-relaxed rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">{value}</h3>
          
          {trend === 'neutral' && subtext && (
            <p className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
              <Minus className="w-3 h-3" />
              {subtext}
            </p>
          )}

          {trend !== 'neutral' && (
             <p className="text-[10px] text-slate-400 mt-2 font-medium">
               vs previous period
             </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
