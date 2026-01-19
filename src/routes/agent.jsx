import { createFileRoute, redirect } from '@tanstack/react-router'
import DashboardView from '../modules/dashboard/ui/views/DashboardView'

export const Route = createFileRoute('/agent')({
  component: DashboardView,
  beforeLoad: () => {
       if (!sessionStorage.getItem('user')) {
            throw redirect({ to: '/login' });
       }
  }
})
