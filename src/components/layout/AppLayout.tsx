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

      <main className="p-6 bg-slate-50 min-h-screen">{children}</main>
    </>
  )
}

export default AppLayout
