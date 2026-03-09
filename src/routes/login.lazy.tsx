import { createLazyFileRoute } from '@tanstack/react-router'
import LoginView from '../modules/auth/ui/views/LoginView'

export const Route = createLazyFileRoute('/login')({
  component: LoginView,
})
