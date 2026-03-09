import { createFileRoute, redirect } from '@tanstack/react-router'

export type DashboardSearchParams = {
  tab?: string
  view?: string
}

const validateSearch = (search: Record<string, unknown>): DashboardSearchParams => ({
  ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
  ...(typeof search.view === 'string' ? { view: search.view } : {}),
})

export const Route = createFileRoute('/dashboard')({
  validateSearch,
  beforeLoad: () => {
    // Simple check if user is logged in (sessionStorage)
    if (!sessionStorage.getItem('user')) {
      throw redirect({ to: '/login' })
    }
  },
})
