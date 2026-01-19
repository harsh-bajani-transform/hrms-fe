import { fetchDashboardData } from '../../services/dashboardService';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
// import { Settings, Lock } from 'lucide-react'; 
// TODO: Access actual icons when migrating Admin features

import { MONTHLY_GOAL } from '../../../../lib/constants';
import { useAuth } from '../../../../context/AuthContext';
import { useDeviceInfo } from '../../../../hooks/useDeviceInfo';

import FilterBar from '../components/FilterBar';
import TabsNavigation from '../components/TabsNavigation';
import OverviewTab from '../components/overview/OverviewTab';
// import { fetchUsersList } from '../../auth/services/authService'; // Will need if Admin
import { fetchProjectsList } from '../../services/projectService';
import { toast } from 'react-hot-toast';
import AppLayout from '../../../../components/layout/AppLayout';

const DashboardView = () => {
  const { 
    user: currentUser, 
    canManageUsers, 
    canManageProjects, 
    isSuperAdmin 
  } = useAuth();
  
  const { device_id, device_type } = useDeviceInfo();
  
  // TanStack Router search params
  const searchParams = useSearch({ strict: false });
  const viewParam = searchParams.view;
  const tabParam = searchParams.tab;

  // State

  const todayStr = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });
  const [selectedTask, setSelectedTask] = useState('All');
  const [comparisonMode, setComparisonMode] = useState('previous_period');
  const [activeTab, setActiveTab] = useState('overview');

  // Placeholders for data that would come from API in a real implementation
  // For the purpose of "OverviewTab" for Agents, these aren't strictly needed as OverviewTab fetches its own data for agents
  // But for Admin view, we would need to fetch logs.
  // For now, initializing as empty to allow render.
 
  const [managedProjects, setManagedProjects] = useState([]);
  
  // Role Logic
  const role = currentUser?.role_name || '';
  const userRole = currentUser?.user_role || '';
  const designation = currentUser?.designation || currentUser?.user_designation || '';
  const roleId = Number(currentUser?.role_id);

  const isAdmin = role === 'admin' || userRole === 'ADMIN' || designation === 'Admin' || roleId === 1;
  const isAgent = role === 'agent' || userRole === 'AGENT' || designation === 'Agent' || roleId === 6;
  const isQA = roleId === 5 || currentUser?.user_designation === 'QA' || designation === 'QA';
  const isAssistantManager = roleId === 4 || designation === 'Assistant Manager';

  

  const canAccessManage = canManageUsers || canManageProjects || isSuperAdmin;
  const canViewIncentivesTab = isAdmin || userRole === 'FINANCE_HR' || userRole === 'PROJECT_MANAGER' || isSuperAdmin;
  const canViewAdherence = isAdmin || userRole === 'PROJECT_MANAGER' || isQA || isSuperAdmin;

  useEffect(() => {
    if (currentUser) {
      if (tabParam === 'manage' && canAccessManage) {
        // eslint-disable-next-line
        setActiveTab('manage');
      } else {
        setActiveTab('overview');
      }
    }
  }, [currentUser, tabParam, canAccessManage]);

  // Load projects if needed (simplified for now)
  useEffect(() => {
    // Ideally load projects only if admin needing it
    const loadProjects = async () => {
      try {
        const res = await fetchProjectsList();
        if (res?.data) {
          setManagedProjects(res.data);
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };

    if (!isAgent) {
      loadProjects();
    }
  }, [isAgent]);

  const allTasks = useMemo(() => {
    const tasks = new Set();
    managedProjects.forEach(p => p.tasks?.forEach(t => tasks.add(t.name)));
    return Array.from(tasks).sort();
  }, [managedProjects]);


  const handleDateRangeChange = useCallback((field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);


// ... inside component

  const [adminDashboardData, setAdminDashboardData] = useState(null);

  // Fetch admin dashboard data
  useEffect(() => {
    const loadAdminDashboard = async () => {
      if (!currentUser?.user_id) return;
      try {
        const payload = {
          logged_in_user_id: currentUser.user_id,
          device_id: device_id || 'web',
          device_type: device_type || 'web'
        };
        const res = await fetchDashboardData(payload);
        if (res.status === 200) {
          setAdminDashboardData(res.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        toast.error("Failed to load dashboard data");
      }
    };

    if (!isAgent && currentUser?.user_id) {
      loadAdminDashboard();
    }
  }, [isAgent, currentUser?.user_id, device_id, device_type]);


  // Analytics Calculation for Admin using fetched data
  const analytics = useMemo(() => {
       if(isAgent) return {}; 

       if (!adminDashboardData) {
            return {
                 prodCurrent: 0,
                 prodPrevious: 0,
                 trendText: "0%",
                 trendDir: "neutral",
                 monthTotal: 0,
                 goalProgress: 0,
                 effectiveGoal: 0,
                 agentStats: [],
                 prevRange: { label: "Prev Period" }
            };
       }

       // Map API response to analytics structure expected by OverviewTab
       const summary = adminDashboardData.summary || {};
       
       return {
            prodCurrent: Number(summary.total_production || 0),
            prodPrevious: 0, // Backend might not return previous period comparison yet
            trendText: "N/A", // Placeholder
            trendDir: "neutral",
            monthTotal: Number(summary.total_production || 0), // Using total as month total for now
            goalProgress: Number(summary.goal_progress || 0), // Assuming backend provides this or 0
            effectiveGoal: MONTHLY_GOAL, 
            agentStats: adminDashboardData.users || [], // Use users list as agent stats if applicable
            prevRange: { label: "Prev Period" }
       };
  }, [isAgent, adminDashboardData]);
  
  const hourlyChartData = []; // Still stubbed until we know API format involved

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Filter Bar */}
        {activeTab !== 'dataentry' && activeTab !== 'manage' && !viewParam && !isAssistantManager && (
          <FilterBar
            isAgent={isAgent}
            isQA={isQA}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            comparisonMode={comparisonMode}
            setComparisonMode={setComparisonMode}
            dateRange={dateRange}
            handleDateRangeChange={handleDateRangeChange}
            allTasks={allTasks}
          />
        )}

        {/* Tabs */}
        {!isAgent && !isQA && !isAssistantManager && activeTab !== 'manage' && (
          <TabsNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAgent={isAgent}
            isQA={isQA}
            isAdmin={isAdmin}
            canViewIncentivesTab={canViewIncentivesTab}
            canViewAdherence={canViewAdherence}
            canAccessManage={canAccessManage}
          />
        )}

        {/* Content Area */}
        {activeTab === 'overview' && (
             <OverviewTab
               analytics={analytics}
               hourlyChartData={hourlyChartData}
               isAgent={isAgent}
               dateRange={dateRange}
             />
        )}
        
        {/* Todo: Implement other tabs */}
        {activeTab !== 'overview' && (
             <div className="bg-white p-12 rounded-lg shadow-sm border border-dashed border-slate-300 text-center">
                  <h3 className="text-lg font-medium text-slate-500">
                       {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module Coming Soon
                  </h3>
                  <p className="text-slate-400 mt-2">We are currently migrating this section.</p>
             </div>
        )}

      </div>
    </AppLayout>
  );
};

export default DashboardView;
