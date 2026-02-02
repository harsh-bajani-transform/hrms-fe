import { createFileRoute, redirect } from '@tanstack/react-router'
import UserTrackingView from '../modules/user-tracking/ui/views/UserTrackingView'
import AppLayout from '../components/layout/AppLayout'

export const Route = createFileRoute('/entry')({
  component: () => (
    <AppLayout>
      <UserTrackingView />
    </AppLayout>
  ),
  beforeLoad: () => {
    if (!sessionStorage.getItem('user')) {
      throw redirect({ to: '/login' });
    }
  }
})
