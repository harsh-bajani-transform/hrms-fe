import type { ReactNode } from 'react'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'

export interface AppLayoutProps {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user: currentUser } = useAuth()

  return (
    <>
      <Header
        currentUser={currentUser}
        handleLogout={() => {
          if (window.sessionStorage) {
            window.sessionStorage.clear()
            window.location.href = '/'
          }
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </>
  )
}

export default AppLayout
