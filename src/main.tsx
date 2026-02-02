import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from './context/AuthContext'
import { router } from './router'
import './index.css'

// Render the app
const rootElement = document.getElementById('root')

if (rootElement && rootElement.innerHTML === '') {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>,
  )
}
