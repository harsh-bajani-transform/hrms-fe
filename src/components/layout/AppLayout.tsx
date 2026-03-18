import type { ReactNode } from "react";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";

export interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user: currentUser } = useAuth();

  return (
    <>
      <Header
        currentUser={currentUser}
        handleLogout={() => {
          if (window.sessionStorage) {
            window.sessionStorage.clear();
            window.location.href = "/";
          }
        }}
      />

      <main className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="space-y-6 mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
          {children}
        </div>
      </main>
    </>
  );
};

export default AppLayout;
