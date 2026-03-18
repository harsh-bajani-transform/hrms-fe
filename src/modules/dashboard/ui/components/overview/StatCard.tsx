import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type Trend = "up" | "down" | "neutral";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: Trend;
  className?: string;
  tooltip?: string;
  alert?: boolean;
}

const StatCard = ({
  title,
  value,
  subtext,
  icon: CardIcon,
  trend = "neutral",
  className = "",
  tooltip = "",
  alert = false,
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-md border-2 transition-all duration-300 group hover:shadow-lg hover:-translate-y-1",
        alert ? "bg-white border-red-300" : "bg-white border-slate-200 hover:border-blue-300",
        className
      )}
    >
      {/* Subtle decorative element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12 group-hover:bg-blue-500/10 transition-colors" />

      <div className="relative p-6 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <p
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider truncate",
                alert ? "text-red-600" : "text-slate-500"
              )}
            >
              {title}
            </p>

            {tooltip && (
              <div className="relative group/tooltip shrink-0">
                <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[10px] leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                </div>
              </div>
            )}
          </div>

          <h3
            className={cn(
              "text-2xl sm:text-3xl font-black truncate",
              alert ? "text-red-700" : "text-slate-900"
            )}
          >
            {value}
          </h3>

          {subtext && (
            <p
              className={cn(
                "text-xs font-bold mt-2 truncate",
                trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-slate-500"
              )}
            >
              {subtext}
            </p>
          )}
        </div>

        <div
          className={cn(
            "p-3.5 rounded-2xl shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110",
            alert
              ? "bg-red-100 text-red-600"
              : trend === "up"
              ? "bg-green-100 text-green-600"
              : "bg-blue-100 text-blue-600"
          )}
        >
          <CardIcon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
