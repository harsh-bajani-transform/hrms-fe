import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtext,
  icon,
  trend = 'neutral', // 'up' | 'down' | 'neutral'
  className = '',
  tooltip = '',
  alert = false
}) => {
  const CardIcon = icon;
  return (
    <div 
      className={`
        bg-white p-4 md:p-5 lg:p-6 rounded-xl shadow-sm border min-w-0 
        ${alert ? 'border-red-200 bg-red-50' : 'border-slate-100'} 
        flex flex-row items-center justify-between gap-4 relative group ${className}
      `}
    >

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 md:mb-1.5">
          <p className={`text-xs sm:text-sm font-medium truncate ${alert ? 'text-red-600' : 'text-slate-500'}`}>
            {title}
          </p>
          
          {tooltip && (
            <div className="relative group/tooltip shrink-0">
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-52 p-2 sm:p-2.5 bg-slate-800 text-white text-xs leading-relaxed rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          )}
        </div>

        <h3 className={`text-xl sm:text-2xl font-bold truncate ${alert ? 'text-red-700' : 'text-slate-800'}`}>
          {value}
        </h3>
        
        {subtext && (
          <p className={`text-xs mt-1.5 md:mt-2 truncate 
            ${trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-500' :
                'text-slate-400'}`}>
            {subtext}
          </p>
        )}
      </div>

      <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg shrink-0 self-center
                ${alert ? 'bg-red-100 text-red-600' :
                trend === 'up' ? 'bg-green-50 text-green-600' :
                     'bg-blue-50 text-blue-600'}`}>
        <CardIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5" />
      </div>
    </div>
  );
};

export default StatCard;
