import { createLazyFileRoute } from "@tanstack/react-router";
import AgentProjectList from "../modules/agent/ui/components/AgentProjectList";
import AppLayout from "../components/layout/AppLayout";

export const Route = createLazyFileRoute("/agent-projects")({
  component: () => (
    <AppLayout>
      <AgentProjectList />
    </AppLayout>
  ),
});
