import { createFileRoute } from '@tanstack/react-router'
import LoginView from '../modules/auth/ui/views/LoginView'

export const Route = createFileRoute('/login')({
  component: LoginView,
})
