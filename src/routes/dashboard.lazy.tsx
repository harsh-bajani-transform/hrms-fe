import { createLazyFileRoute } from '@tanstack/react-router'
import DashboardView from '../modules/dashboard/ui/views/DashboardView'

export const Route = createLazyFileRoute('/dashboard')({
  component: DashboardView,
})
