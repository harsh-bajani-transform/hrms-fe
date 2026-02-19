import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DailyBillableReport from "./DailyBillableReport";
import MonthlyBillableReport from "./MonthlyBillableReport";

const BillableReport: React.FC = () => {
  // State for tab toggle with localStorage persistence
  const [activeToggle, setActiveToggle] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("billable_active_tab") || "daily";
    }
    return "daily";
  });

  // Persist tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("billable_active_tab", activeToggle);
    }
  }, [activeToggle]);

  return (
    <div className="w-full space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <Button
            variant={activeToggle === "daily" ? "default" : "ghost"}
            className={`flex-1 font-medium text-sm transition-all focus-visible:ring-0 ${
              activeToggle === "daily"
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveToggle("daily")}
          >
            Daily Report
          </Button>
          <Button
            variant={activeToggle === "monthly" ? "default" : "ghost"}
            className={`flex-1 font-medium text-sm transition-all focus-visible:ring-0 ${
              activeToggle === "monthly"
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveToggle("monthly")}
          >
            Monthly Report
          </Button>
        </div>
      </div>

      {activeToggle === "daily" && <DailyBillableReport />}
      {activeToggle === "monthly" && <MonthlyBillableReport />}
    </div>
  );
};

export default BillableReport;
