import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { fetchDashboardData } from "../../../dashboard/services/dashboardService";
import type {
  DashboardFilterPayload,
  DashboardFilterData,
} from "../../../dashboard/types";

const QADashboardView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] =
    useState<DashboardFilterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.user_id) return;
      setLoading(true);
      setError(null);
      try {
        const payload: DashboardFilterPayload = {
          logged_in_user_id: user.user_id,
          device_id:
            typeof user.device_id === "string" ? user.device_id : "web123",
          device_type:
            typeof user.device_type === "string" ? user.device_type : "web",
        };
        const res = await fetchDashboardData(payload);
        setDashboardData(res?.data || null);
      } catch {
        setError("Failed to load dashboard data");
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600 font-medium">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-white rounded shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500 font-medium text-lg">
          No dashboard data available
        </p>
      </div>
    );
  }

  // Example: Display summary and user count if available
  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">QA Dashboard</h2>
        {dashboardData.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-2">
                Total Production
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {dashboardData.summary.total_production ?? "-"}
              </div>
            </div>
            <div className="bg-linear-to-br from-green-50 to-green-100 p-5 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-2">
                QC Score
              </div>
              <div className="text-3xl font-bold text-green-900">
                {dashboardData.summary.qc_score ?? "-"}
              </div>
            </div>
            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
              <div className="text-sm font-medium text-purple-700 mb-2">
                User Count
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {dashboardData.summary.user_count ?? "-"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QADashboardView;
