import { createLazyFileRoute } from '@tanstack/react-router'
import UserTrackingView from '../modules/user-tracking/ui/views/UserTrackingView'
import AppLayout from '../components/layout/AppLayout'

export const Route = createLazyFileRoute('/entry')({
  component: () => (
    <AppLayout>
      <UserTrackingView />
    </AppLayout>
  ),
})
