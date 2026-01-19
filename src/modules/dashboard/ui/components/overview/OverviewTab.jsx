import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Target, Users, Clock, CheckCircle, TrendingUp, Award, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';

import StatCard from './StatCard';
import HourlyChart from './HourlyChart';
import { useAuth } from '../../../../../context/AuthContext';
import { useDeviceInfo } from '../../../../../hooks/useDeviceInfo';
import { fetchDashboardData } from '../../../services/dashboardService';

const OverviewTab = ({ analytics, hourlyChartData, isAgent, dateRange }) => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard data for agents
  const getDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const payload = {
        logged_in_user_id: user.user_id,
        device_id: device_id || 'web_default',
        device_type: device_type || 'web'
      };
      console.log('[OverviewTab] 📤 Sending request to /dashboard/filter');
      
      const response = await fetchDashboardData(payload);
      
      if (response.status === 200) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('[OverviewTab] Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load dashboard data';
      toast.error(`Backend Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user.user_id, device_id, device_type]);

  useEffect(() => {
    if (isAgent && user?.user_id) {
      getDashboardData();
    }
  }, [isAgent, user?.user_id, device_id, device_type, dateRange, getDashboardData]);

  // Extract agent stats from API response
  // Note: API returns only the logged-in agent's data based on logged_in_user_id
  const agentStats = {
    totalBillableHours: parseFloat(dashboardData?.summary?.total_production || 0),
    qcScore: parseFloat(dashboardData?.summary?.qc_score || 0),
    taskCount: parseInt(dashboardData?.summary?.task_count || 0),
    projectCount: parseInt(dashboardData?.summary?.project_count || 0),
  };

  // Extract agent projects from API response
  const agentProjects = dashboardData?.projects || [];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Grid container with responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {isAgent ? (
          <>
            {/* Agent-specific cards */}
            <StatCard
              title="Total Billable Hours"
              value={agentStats.totalBillableHours.toFixed(2)}
              subtext="Hours logged"
              icon={Clock}
              trend="neutral"
              tooltip="Total billable hours tracked."
              className="min-w-0"
            />
            <StatCard
              title="QC Score"
              value={`${agentStats.qcScore}%`}
              subtext="Quality rating"
              icon={CheckCircle}
              trend="neutral"
              tooltip="Quality control score."
              className="min-w-0"
            />
            <StatCard
              title="Performance"
              value={agentStats.taskCount.toLocaleString()}
              subtext="Tasks assigned"
              icon={TrendingUp}
              trend="neutral"
              tooltip="Total tasks assigned to you."
              className="min-w-0"
            />
            <StatCard
              title="Projects"
              value={agentStats.projectCount.toLocaleString()}
              subtext="Active projects"
              icon={Award}
              trend="neutral"
              tooltip="Number of projects you're working on."
              className="min-w-0"
            />
          </>
        ) : (
          <>
            {/* Admin cards - Requires 'analytics' prop to be fully populated by parent */}
            <StatCard
              title="Production (Selected)"
              value={analytics?.prodCurrent?.toLocaleString() || '0'}
              subtext={analytics?.trendText || '0%'}
              icon={Activity}
              trend={analytics?.trendDir || 'neutral'}
              tooltip="Total production volume in range."
              className="min-w-0"
            />
            <StatCard
              title={`Production (${analytics?.prevRange?.label || 'Prev'})`}
              value={analytics?.prodPrevious?.toLocaleString() || '0'}
              subtext="Vs Previous"
              icon={Calendar}
              trend="neutral"
              tooltip="Comparison period volume."
              className="min-w-0"
            />
            <StatCard
              title="MTD Progress"
              value={`${analytics?.goalProgress?.toFixed(1) || '0'}%`}
              subtext={`Target: ${analytics?.effectiveGoal?.toLocaleString() || '0'}`}
              icon={Target}
              trend="neutral"
              tooltip="% of Monthly Target achieved."
              className="min-w-0"
            />
            <StatCard
              title="Active Agents"
              value={analytics?.agentStats?.length || 0}
              subtext="In range"
              icon={Users}
              trend="neutral"
              tooltip="Agent Activity count."
              className="min-w-0"
            />
          </>
        )}
      </div>

      {/* Conditional content based on user role */}
      {isAgent ? (
        /* Agent Project Billable Hours Section */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Project Billable Hours</h3>
            </div>
            <p className="text-blue-100 text-sm mt-1">Hours logged per project in selected date range</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-500 mt-3">Loading project data...</p>
              </div>
            ) : agentProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No project data available</p>
                <p className="text-slate-400 text-sm mt-1">You haven't worked on any projects yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentProjects.map((project, index) => {
                  const billableHours = parseFloat(project.billable_hours || project.total_billable_hours || 0);
                  return (
                    <div
                      key={project.project_id || index}
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{project.project_name}</h4>
                          <p className="text-xs text-slate-500">{project.project_code || 'Project'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {billableHours.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-500">Hours</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Admin Chart Section */
        <div className="w-full overflow-hidden">
          <HourlyChart data={hourlyChartData} />
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
