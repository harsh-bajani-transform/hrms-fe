import { createLazyFileRoute } from "@tanstack/react-router";
import OverviewTab from "../modules/dashboard/ui/components/overview/OverviewTab";
import AppLayout from "../components/layout/AppLayout";
import { Analytics } from "../modules/dashboard/types";

const initialAnalytics: Analytics = {
  prodCurrent: 0,
  prodPrevious: 0,
  trendText: "0%",
  trendDir: "neutral",
  monthTotal: 0,
  goalProgress: 0,
  effectiveGoal: 0,
  agentStats: [],
  prevRange: { label: "Prev Period" },
};

export const Route = createLazyFileRoute("/agent-billable-report")({
  component: () => (
    <AppLayout>
      <OverviewTab
        isAgent={true}
        key="agent-billable-report"
        analytics={initialAnalytics}
        hourlyChartData={[]}
        dateRange={{ start: "", end: "" }}
      />
    </AppLayout>
  ),
});
