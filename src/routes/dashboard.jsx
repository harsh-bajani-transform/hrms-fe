import { createFileRoute, redirect } from '@tanstack/react-router'
import DashboardView from '../modules/dashboard/ui/views/DashboardView'

export const Route = createFileRoute('/dashboard')({
  component: DashboardView,
  beforeLoad: () => {
       // Simple check if user is logged in (sessionStorage)
       // context.auth would be better if integrated with router context, but this works for now
       if (!sessionStorage.getItem('user')) {
            throw redirect({ to: '/login' });
       }
  }
})
