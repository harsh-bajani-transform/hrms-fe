import React from "react";
import {
  Users,
  Calendar,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";

interface QATrackerReportSummaryProps {
  totals: {
    activeAgents: number;
    assignedHours: number;
    tenureTarget: number;
    production: number;
    billableHours: number;
  };
  isLoading: boolean;
  hasData: boolean;
}

const QATrackerReportSummary: React.FC<QATrackerReportSummaryProps> = ({
  totals,
  isLoading,
  hasData,
}) => {
  if (isLoading || !hasData) return null;

  const cards = [
    {
      title: "Total Active Agents",
      value: totals.activeAgents,
      icon: Users,
      bgColor: "bg-blue-50",
      iconBgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
      isDecimal: false,
    },
    {
      title: "Total Assigned Hours",
      value: totals.assignedHours,
      icon: Calendar,
      bgColor: "bg-orange-50",
      iconBgColor: "bg-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      iconColor: "text-orange-600",
      isDecimal: true,
    },
    {
      title: "Total Per Hour Target",
      value: totals.tenureTarget,
      icon: Target,
      bgColor: "bg-purple-50",
      iconBgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      iconColor: "text-purple-600",
      isDecimal: true,
    },
    {
      title: "Total Production",
      value: totals.production,
      icon: TrendingUp,
      bgColor: "bg-teal-50",
      iconBgColor: "bg-teal-100",
      borderColor: "border-teal-200",
      textColor: "text-teal-700",
      iconColor: "text-teal-600",
      isDecimal: true,
    },
    {
      title: "Total Billable Hours",
      value: totals.billableHours,
      icon: Clock,
      bgColor: "bg-green-50",
      iconBgColor: "bg-green-100",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-600",
      isDecimal: true,
    },
  ];

  return (
    <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
        <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
        Summary Totals
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl p-4 shadow-sm border ${card.borderColor} hover:shadow-md transition-all duration-300 group`}
          >
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">
                {card.title}
              </p>
              <div className={`p-1.5 rounded-lg ${card.iconBgColor} transition-colors group-hover:bg-opacity-80`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-black ${card.textColor} tracking-tight`}>
              {card.isDecimal ? card.value.toFixed(2) : card.value}
            </p>
            <div className={`h-1 w-full mt-3 rounded-full ${card.iconBgColor} bg-opacity-30 overflow-hidden`}>
              <div className={`h-full w-1/3 rounded-full ${card.iconColor.replace('text', 'bg')}`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QATrackerReportSummary;
