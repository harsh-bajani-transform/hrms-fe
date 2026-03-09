import { createLazyFileRoute } from '@tanstack/react-router'
import QCForm from '../modules/qa/ui/components/QCForm'

export const Route = createLazyFileRoute('/qc-form')({
  component: QCForm,
})
