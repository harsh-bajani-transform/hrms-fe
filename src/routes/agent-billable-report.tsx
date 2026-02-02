import { createFileRoute, redirect } from "@tanstack/react-router";
import OverviewTab from "../modules/dashboard/ui/components/overview/OverviewTab";
import AppLayout from "../components/layout/AppLayout";

export const Route = createFileRoute("/agent-billable-report")({
  component: () => (
    <AppLayout>
      <OverviewTab
        isAgent={true}
        key="agent-billable-report"
        analytics={{} as any}
        hourlyChartData={[]}
        dateRange={{ start: "", end: "" }}
      />
    </AppLayout>
  ),
  beforeLoad: () => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (!user.user_id) {
      throw redirect({ to: "/login" });
    }
    if (Number(user.role_id) !== 6) {
      throw redirect({ to: "/dashboard" });
    }
  },
});
