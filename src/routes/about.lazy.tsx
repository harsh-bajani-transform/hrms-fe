import { createLazyFileRoute } from '@tanstack/react-router'
import AboutView from '../modules/about/ui/views/about-view'

export const Route = createLazyFileRoute('/about')({
  component: About,
})

function About() {
  return <AboutView />
}
