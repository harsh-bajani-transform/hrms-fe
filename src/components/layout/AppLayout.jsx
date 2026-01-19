import React from "react";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";

const AppLayout = ({ children }) => {
  // Get user and permissions from context
  const { 
    user: currentUser, 
  } = useAuth();

  return (
    <>
      <Header
        currentUser={currentUser}
        handleLogout={() => {
          // This will be handled by Header, but we can pass a custom logout if needed.
          // The AuthContext provides logout, but Header also handles it directly with sessionStorage fallback.
          // Ideally:
          // const { logout } = useAuth();
          // logout();
          if (window.sessionStorage) {
             window.sessionStorage.clear();
             window.location.href = '/';
          }
        }}
      />

      {/* page content */}
      <main className="p-6 bg-slate-50 min-h-screen">
        {children}
      </main>
    </>
  );
};

export default AppLayout;
