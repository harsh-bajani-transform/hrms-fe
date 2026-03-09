import { createRouter } from '@tanstack/react-router'
import LoadingScreen from './components/common/LoadingScreen'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const router = createRouter({ 
  routeTree,
  defaultPendingComponent: LoadingScreen,
  defaultPendingMs: 500, // Show after 500ms of loading to avoid flicker on fast net
  defaultPendingMinMs: 400, // Show for at least 400ms to avoid flash
})
