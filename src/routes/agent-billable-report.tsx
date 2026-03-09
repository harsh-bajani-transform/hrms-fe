import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agent-billable-report")({
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
