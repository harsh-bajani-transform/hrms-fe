import React from "react";

interface QATrackerReportSummaryProps {
  totals: {
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

  return (
    <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
      <h3 className="text-sm font-bold text-blue-900 mb-5 flex items-center gap-2 uppercase tracking-tight">
        <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
        Summary Totals
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Per Hour Target */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 hover:border-blue-300 transition-colors">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            Total Per Hour Target
          </p>
          <p className="text-3xl font-extrabold text-blue-700">
            {totals.tenureTarget.toFixed(2)}
          </p>
        </div>

        {/* Total Production */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100 hover:border-green-300 transition-colors">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            Total Production
          </p>
          <p className="text-3xl font-extrabold text-green-700">
            {totals.production.toFixed(2)}
          </p>
        </div>

        {/* Total Billable Hours */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 hover:border-purple-300 transition-colors">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            Total Billable Hours
          </p>
          <p className="text-3xl font-extrabold text-purple-700">
            {totals.billableHours.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QATrackerReportSummary;
