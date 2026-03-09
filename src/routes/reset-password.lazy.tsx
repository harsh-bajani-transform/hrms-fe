import { createLazyFileRoute } from "@tanstack/react-router";
import ResetPasswordView from "@/modules/auth/ui/views/ResetPasswordView";

export const Route = createLazyFileRoute("/reset-password")({
  component: ResetPasswordView,
});
