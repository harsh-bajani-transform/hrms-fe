
// src/declarations.d.ts
// Use this file to declare modules, e.g., for import of non-code assets.

import { createRouter } from "@tanstack/react-router"

declare module '@tanstack/react-router' {
  interface Register {
    // This infers the type of the router so you get type safety
    router: ReturnType<typeof createRouter<any>>
  }
}