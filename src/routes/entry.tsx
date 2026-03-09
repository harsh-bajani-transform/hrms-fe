import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/entry')({
  beforeLoad: () => {
    if (!sessionStorage.getItem('user')) {
      throw redirect({ to: '/login' });
    }
  }
})
