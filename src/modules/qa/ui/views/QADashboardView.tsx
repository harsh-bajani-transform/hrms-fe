import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { fetchDashboardData } from "../../../dashboard/services/dashboardService";
import type { UserRef, DashboardFilterPayload, DashboardFilterData } from "../../../dashboard/types";

const QADashboardView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardFilterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.user_id) return;
      setLoading(true);
      setError(null);
      try {
        const payload: DashboardFilterPayload = {
          logged_in_user_id: user.user_id,
          device_id: typeof user.device_id === 'string' ? user.device_id : 'web123',
          device_type: typeof user.device_type === 'string' ? user.device_type : 'web',
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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-gray-500 font-medium">No dashboard data available</p>
      </div>
    );
  }

  // Example: Display summary and user count if available
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800">QA Dashboard</h2>
      {dashboardData.summary && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="font-semibold">Summary</div>
          <div>Total Production: {dashboardData.summary.total_production ?? '-'}</div>
          <div>QC Score: {dashboardData.summary.qc_score ?? '-'}</div>
          <div>User Count: {dashboardData.summary.user_count ?? '-'}</div>
        </div>
      )}
      {/* Add more dashboard sections as needed */}
    </div>
  );
};

export default QADashboardView;
