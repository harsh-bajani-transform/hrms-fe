import { createFileRoute, redirect } from "@tanstack/react-router";
import AgentProjectList from "../modules/agent/ui/components/AgentProjectList";
import AppLayout from "../components/layout/AppLayout";

export const Route = createFileRoute("/agent-projects")({
  component: () => (
    <AppLayout>
      <AgentProjectList />
    </AppLayout>
  ),
  beforeLoad: () => {
    const raw = sessionStorage.getItem("user") || "{}";
    const user = JSON.parse(raw) as { user_id?: unknown; role_id?: unknown };

    if (!user.user_id) {
      throw redirect({ to: "/login" });
    }
    if (Number(user.role_id) !== 6) {
      throw redirect({ to: "/dashboard" });
    }
  },
});
