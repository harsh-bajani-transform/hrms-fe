import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/qc-form')({
  beforeLoad: () => {
    // Simple check if user is logged in (sessionStorage)
    if (!sessionStorage.getItem('user')) {
      throw redirect({ to: '/login' })
    }
  },
})
