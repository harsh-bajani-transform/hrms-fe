import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/agent')({
  beforeLoad: () => {
    if (!sessionStorage.getItem('user')) {
      throw redirect({ to: '/login' });
    }
  }
})
