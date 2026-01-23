import { createFileRoute, redirect } from '@tanstack/react-router'
import AgentDashboardView from '../modules/agent/ui/views/AgentDashboardView'

export const Route = createFileRoute('/agent')({
  component: AgentDashboardView,
  beforeLoad: () => {
    if (!sessionStorage.getItem('user')) {
      throw redirect({ to: '/login' });
    }
  }
})
