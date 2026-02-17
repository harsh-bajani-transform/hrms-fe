import { useEffect, useState } from "react";
import { fetchDropdowns } from "../../services/agentService";
import { useAuth } from "../../../../context/AuthContext";

import TrackerTable from "../components/TrackerTable";
import AgentTabsNavigation from "../components/AgentTabsNavigation";
import AgentProjectList from "../components/AgentProjectList";
import AppLayout from "../../../../components/layout/AppLayout";
import { type AgentTabId, type AgentProjectWithTasks } from "../../types";
import AgentBillableReport from "../components/AgentBillableReport";
import TrackerFormModal from "../components/TrackerFormModal";

export interface AgentDashboardViewProps {
  embedded?: boolean;
}

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const AgentDashboardView = ({ embedded = false }: AgentDashboardViewProps) => {
  const { user } = useAuth();
  const isAdmin =
    user?.role_name === "admin" ||
    user?.role_name === "superadmin" ||
    Boolean((user as Record<string, unknown> | null)?.isSuperAdmin);

  const [projects, setProjects] = useState<AgentProjectWithTasks[]>([]);
  const [activeTab, setActiveTab] = useState<AgentTabId>("overview");
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch projects with tasks for tracker form
  useEffect(() => {
    const fetchProjectsWithTasks = async () => {
      if (user?.user_id == null) return;

      try {
        const payload = {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user.user_id,
        };

        const res: unknown = await fetchDropdowns(payload);
        const data = asRecord(res) ? res.data : undefined;
        setProjects(
          Array.isArray(data) ? (data as AgentProjectWithTasks[]) : [],
        );
      } catch (error) {
        console.error(
          "[AgentDashboard] Error fetching projects with tasks:",
          error,
        );
        setProjects([]);
      }
    };

    void fetchProjectsWithTasks();
  }, [user?.user_id]);

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const content = (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 px-4 pt-8 animate-in fade-in duration-500">
      {/* Navigation Tabs */}
      <AgentTabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "overview" && (
        <div className="mt-4">
          <TrackerTable
            userId={isAdmin ? null : user?.user_id}
            projects={projects}
            onAddEntry={() => setIsTrackerModalOpen(true)}
            key={refreshTrigger}
          />
        </div>
      )}

      {activeTab === "projects" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AgentProjectList />
        </div>
      )}

      {activeTab === "billable_report" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AgentBillableReport />
        </div>
      )}

      <TrackerFormModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        onSuccess={handleSuccess}
        projects={projects}
      />
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
};

export default AgentDashboardView;
