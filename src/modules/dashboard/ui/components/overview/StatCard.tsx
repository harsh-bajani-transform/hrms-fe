import type { LucideIcon } from 'lucide-react'
import { Info } from 'lucide-react'

export type Trend = 'up' | 'down' | 'neutral'

export interface StatCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  trend?: Trend
  className?: string
  tooltip?: string
  alert?: boolean
}

const StatCard = ({
  title,
  value,
  subtext,
  icon: CardIcon,
  trend = 'neutral',
  className = '',
  tooltip = '',
  alert = false,
}: StatCardProps) => {
  return (
    <div
      className={`
        bg-white p-5 md:p-6 rounded-xl shadow-sm border min-w-0
        ${alert ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100' : 'border-gray-200'}
        flex flex-row items-center justify-between gap-4 relative group hover:shadow-md transition-all duration-200 ${className}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 md:mb-1.5">
          <p
            className={`text-xs sm:text-sm font-medium truncate ${alert ? 'text-red-600' : 'text-slate-500'}`}
          >
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

        <h3
          className={`text-2xl sm:text-3xl font-bold truncate ${alert ? 'text-red-700' : 'text-gray-900'}`}
        >
          {value}
        </h3>

        {subtext && (
          <p
            className={`text-xs sm:text-sm mt-1.5 md:mt-2 truncate font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}
          >
            {subtext}
          </p>
        )}
      </div>

      <div
        className={`p-3 sm:p-3.5 md:p-4 rounded-xl shrink-0 self-center shadow-sm
                ${alert ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700' : trend === 'up' ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-700' : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'}`}
      >
        <CardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  )
}

export default StatCard
