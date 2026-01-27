/**
 * File: QAAgentDashboard.jsx
 * Description: QA Agent Dashboard with stats and pending QC files
 */
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Users, FileCheck, Download, FileText, TrendingUp, Activity } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { log, logError } from "../../../../config/environment";
import QATabsNavigation from "../../../qa/ui/components/QATabsNavigation";
import BillableReport from "./BillableReport";

const QAAgentDashboard = ({ dateRange }) => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();
  
  const [stats, setStats] = useState({
    totalAgents: 0,
    pendingQCFiles: 0,
    placeholder1: 0,
    placeholder2: 0
  });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        log('[QAAgentDashboard] Fetching dashboard data with dates:', dateRange);
        
        const payload = {
          logged_in_user_id: user?.user_id || user?.id,
          device_id: device_id || 'web_default',
          device_type: device_type || 'web',
          date_from: dateRange?.start,
          date_to: dateRange?.end
        };
        
        const res = await api.post('/dashboard/filter', payload);
        
        if (res.status === 200 && res.data?.data) {
          const responseData = res.data.data;
          const trackers = responseData.tracker || [];
          const users = responseData.users || [];
          const tasks = responseData.tasks || [];
          const summary = responseData.summary || {};
          
          const taskMap = {};
          tasks.forEach(task => {
            taskMap[task.task_id] = {
              task_name: task.task_name,
              task_target: task.task_target
            };
          });
          
          const trackersWithFiles = trackers
            .filter(tracker => tracker.tracker_file)
            .map(tracker => {
              const taskInfo = taskMap[tracker.task_id] || {};
              return {
                ...tracker,
                task_name: taskInfo.task_name || 'N/A'
              };
            })
            .slice(0, 5); 
          
          setStats({
            totalAgents: users.length || 0,
            pendingQCFiles: trackersWithFiles.length || 0,
            placeholder1: summary.tracker_rows || 0,
            placeholder2: summary.project_count || 0
          });
          
          setPendingFiles(trackersWithFiles);
          log('[QAAgentDashboard] Dashboard data loaded - Agents:', users.length, 'Files:', trackersWithFiles.length);
        }
      } catch (err) {
        logError('[QAAgentDashboard] Error fetching dashboard data:', err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
       fetchDashboardData();
    }
  }, [user?.user_id, user?.id, device_id, device_type, dateRange]);

  const handleQCForm = (tracker) => {
    log('[QAAgentDashboard] Opening QC Form for tracker:', tracker.tracker_id);
    toast.success("QC Form functionality coming soon!");
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, iconBgColor, iconColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="text-slate-400 text-xs">?</span>
          </div>
        </div>
        <div className={`${iconBgColor} p-2.5 rounded-lg`}>
           {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Navigation Tabs */}
      <QATabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              title="Total Agents"
              value={stats.totalAgents}
              subtitle="Assigned agents"
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={FileCheck}
              title="Pending QC Files"
              value={stats.pendingQCFiles}
              subtitle="Files to review"
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={TrendingUp}
              title="Placeholder 1"
              value={stats.placeholder1}
              subtitle="Data pending"
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={Activity}
              title="Placeholder 2"
              value={stats.placeholder2}
              subtitle="Data pending"
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>

          {/* Latest Pending QC Files */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Blue Header Section */}
            <div className="bg-blue-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Latest Pending QC Files</h2>
                  <p className="text-sm text-blue-100 mt-0.5">Files awaiting quality check review</p>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500">Loading pending files...</span>
                </div>
              </div>
            ) : pendingFiles.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-slate-600 font-medium text-lg mb-1">No pending QC files</p>
                <p className="text-slate-400 text-sm">All files have been reviewed</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingFiles.map((file, index) => (
                  <div
                    key={file.tracker_id || index}
                    className="px-6 py-4 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Date/Time</p>
                            <p className="text-sm font-medium text-slate-700">
                              {file.date_time
                                ? format(new Date(file.date_time), "M/d/yyyy")
                                : "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {file.date_time
                                ? format(new Date(file.date_time), "h:mma")
                                : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Agent</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {file.user_name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Project</p>
                            <p className="text-sm text-slate-700">
                              {file.project_name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Task</p>
                            <p className="text-sm text-slate-700">
                              {file.task_name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">File</p>
                            {file.tracker_file ? (
                              <a
                                href={file.tracker_file}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </a>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleQCForm(file)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        QC Form
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Billable Report Tab */}
      {activeTab === 'billable_report' && <BillableReport />}
    </div>
  );
};

export default QAAgentDashboard;

