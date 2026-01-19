import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // Check if user is already logged in
    const userStr = sessionStorage.getItem('user');
    let redirectPath = '/login';
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // 6 = Agent
        if (Number(user.role_id) === 6) {
             redirectPath = '/agent';
        } else {
             redirectPath = '/dashboard';
        }
      } catch {
        // Invalid json, stay with login
      }
    }

    throw redirect({
      to: redirectPath,
    })
  },
})