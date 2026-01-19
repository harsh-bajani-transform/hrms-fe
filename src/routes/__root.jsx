import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from "react-hot-toast";

const RootLayout = () => (
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '8px',
          background: '#18181b',
          color: '#fff',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          fontSize: '1rem',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          padding: '14px 20px',
          minWidth: '220px',
          maxWidth: '90vw',
          animation: 'toastSlideIn 0.35s ease-out',
        },
        success: {
          style: {
            background: '#22c55e',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#16a34a',
          },
        },
        error: {
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#b91c1c',
          },
        },
      }}
    />
    <Outlet />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRoute({ component: RootLayout })