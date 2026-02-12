import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordView from "@/modules/auth/ui/views/ResetPasswordView";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordView,
});
