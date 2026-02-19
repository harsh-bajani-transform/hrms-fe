import React from "react";
import { FileDown, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QATrackerReportHeaderProps {
  onExport: () => void;
  isLoading: boolean;
  hasData: boolean;
}

const QATrackerReportHeader: React.FC<QATrackerReportHeaderProps> = ({
  onExport,
  isLoading,
  hasData,
}) => {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tracker Report</h2>
        </div>
        <Button
          onClick={onExport}
          disabled={isLoading || !hasData}
          className=" px-6 bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-colors"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>
    </div>
  );
};

export default QATrackerReportHeader;
