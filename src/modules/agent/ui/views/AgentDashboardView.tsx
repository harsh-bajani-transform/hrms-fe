import { useEffect, useState } from "react";
import { fetchDropdowns } from "../../services/agentService";
import { useAuth } from "../../../../context/AuthContext";
import { useSearch, useNavigate } from "@tanstack/react-router";

import TrackerTable from "../components/TrackerTable";
import AgentTabsNavigation from "../components/AgentTabsNavigation";
import AgentProjectList from "../components/AgentProjectList";
import AppLayout from "../../../../components/layout/AppLayout";
import { type AgentTabId, type AgentProjectWithTasks } from "../../types";
import AgentBillableReport from "../components/AgentBillableReport";
import AIEvaluation from "../components/AIEvaluation";
import TrackerFormModal from "../components/TrackerFormModal";

export interface AgentDashboardViewProps {
  embedded?: boolean;
}

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const AgentDashboardView = ({ embedded = false }: AgentDashboardViewProps) => {
  const { user } = useAuth();
  const search = useSearch({ strict: false }) as Record<string, string>;
  const navigate = useNavigate();

  const [projects, setProjects] = useState<AgentProjectWithTasks[]>([]);
  const activeTab = (search.tab as AgentTabId) || "overview";
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [refreshTrigger, setRefreshTrigger] = useState(0); // Removed as per diff

  // Submission window states
  const [isSubmissionWindowOpen, setIsSubmissionWindowOpen] = useState(false);
  const [nextWindowTime, setNextWindowTime] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");

  // Submission window logic
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Submission window is open for the first 15 minutes of every hour
      const isOpen = minutes < 15;
      setIsSubmissionWindowOpen(isOpen);

      if (isOpen) {
        const remainingMinutes = 14 - minutes;
        const remainingSeconds = 59 - seconds;
        setTimeRemaining(`${remainingMinutes}m ${remainingSeconds}s`);
      } else {
        // If not open, calculate time until next window opens (start of next hour)
        const remainingMinutes = 59 - minutes;
        const remainingSeconds = 59 - seconds;
        setTimeRemaining(`${remainingMinutes}m ${remainingSeconds}s`);
      }

      // Calculate next window time (always at the top of the hour)
      const nextWindow = new Date(now);
      if (!isOpen) {
        nextWindow.setHours(now.getHours() + 1);
      }
      nextWindow.setMinutes(0);
      nextWindow.setSeconds(0); // Ensure seconds are also reset for display
      setNextWindowTime(
        nextWindow.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Tab Change (Update Search Params)
  const handleTabChange = (tab: AgentTabId) => {
    navigate({
      to: "/agent",
      search: { tab },
    });
  };

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

  // const handleSuccess = () => { // Removed as per diff
  //   setRefreshTrigger((prev) => prev + 1);
  // };

  const content = (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 px-4 pt-8 animate-in fade-in duration-500">
      {/* Navigation Tabs */}
      <AgentTabsNavigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {activeTab === "overview" && (
        <div className="mt-4">
          <TrackerTable
            // userId={isAdmin ? null : user?.user_id} // Modified based on diff removing isAdmin
            userId={user?.user_id}
            projects={projects}
            onAddEntry={() => setIsModalOpen(true)} // Changed to setIsModalOpen
            // key={refreshTrigger} // Removed as per diff
            isSubmissionWindowOpen={isSubmissionWindowOpen}
            nextWindowTime={nextWindowTime}
            timeRemaining={timeRemaining}
          />
        </div>
      )}

      {activeTab === "projects" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AgentProjectList />
        </div>
      )}

      {activeTab === "ai_evaluation" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AIEvaluation projects={projects} />
        </div>
      )}

      {activeTab === "billable_report" && (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
          <AgentBillableReport />
        </div>
      )}

      <TrackerFormModal
        isOpen={isModalOpen} // Changed to isModalOpen
        onClose={() => setIsModalOpen(false)} // Changed to setIsModalOpen
        onSuccess={() => {
          // TrackerTable will refresh via its own state if needed,
          // but we might need to trigger a refresh here if we had a refresh key
        }} // Modified onSuccess handler
        projects={projects}
        isSubmissionWindowOpen={isSubmissionWindowOpen}
      />
    </div>
  );

  return embedded ? content : <AppLayout>{content}</AppLayout>;
};

export default AgentDashboardView;
