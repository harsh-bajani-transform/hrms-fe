import { createFileRoute } from '@tanstack/react-router'
import ManageView from '../modules/manage/ui/views/ManageView'
import AppLayout from '../components/layout/AppLayout'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <ManageView />
    </AppLayout>
  )
}
