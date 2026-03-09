import { createLazyFileRoute } from '@tanstack/react-router'
import AgentDashboardView from '../modules/agent/ui/views/AgentDashboardView'

export const Route = createLazyFileRoute('/agent')({
  component: AgentDashboardView,
})
