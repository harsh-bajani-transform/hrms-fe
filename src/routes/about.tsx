import { createFileRoute } from '@tanstack/react-router'
import AboutView from '../modules/about/ui/views/about-view'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return <AboutView />
}