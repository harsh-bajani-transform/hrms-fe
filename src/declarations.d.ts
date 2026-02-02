
// src/declarations.d.ts
// Use this file to declare modules, e.g., for import of non-code assets.

import { router } from './router'

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
