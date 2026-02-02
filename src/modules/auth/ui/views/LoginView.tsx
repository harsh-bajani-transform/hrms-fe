import React, { useState, useEffect } from "react";
import { User, Lock, LogIn, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "react-hot-toast";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { log, logError } from "../../../../config/environment";

// Role ID to role string mapping
const ROLE_MAP = {
  1: "SUPER_ADMIN",
  2: "ADMIN",
  3: "PROJECT_MANAGER",
  4: "ASSISTANT_MANAGER",
  5: "QA_AGENT",
  6: "AGENT"
};

// Email format checker
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginView = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Frontend validation errors
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Backend field-specific errors
  const [backendUsernameError, setBackendUsernameError] = useState("");
  const [backendPasswordError, setBackendPasswordError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();

  // Redirect logged-in users away from login page
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);


  // LIVE email validation
  const handleUsernameChange = (value) => {
    setUsername(value);
    setBackendUsernameError(""); // clear backend error

    if (!value.trim()) {
      setUsernameError("Please enter your email");
    } else if (!isValidEmail(value)) {
      setUsernameError("Please enter a valid email address");
    } else {
      setUsernameError("");
    }
  };

  // LIVE password validation
  const handlePasswordChange = (value) => {
    setPassword(value);
    setBackendPasswordError(""); // clear backend error

    if (!value.trim()) {
      setPasswordError("Please enter your password");
    } else if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    // Final validation check
    if (usernameError || passwordError || !username || !password) {
      if (!username) setUsernameError("Please enter your email");
      if (!password) setPasswordError("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(username, password, device_id, device_type);
      log('[LoginPage] Login successful');
      
      const userData = response.data?.data || response.data?.user || response.data;
      
      if (!userData || !userData.user_id) {
        throw new Error('Invalid response format from backend');
      }
      
      if (userData.is_active === 0 || userData.is_active === false) {
        toast.error("Your account is inactive. Please contact your admin.", { duration: 5000 });
        return;
      }
      
      login(userData);
      toast.success("You are now logged in!", { duration: 4000 });

      navigate({ to: "/dashboard", replace: true });

    } catch (err) {
      logError('[LoginPage] Login failed:', err);
      const message = err?.message || err?.response?.data?.message || "Invalid credentials";
      
      if (message.toLowerCase().includes("email")) {
        setBackendUsernameError(message);
      } else if (message.toLowerCase().includes("password")) {
        setBackendPasswordError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl">
        <div className="bg-[#1e40af] p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
          <p className="text-blue-100 font-medium">Sign in to TFS Ops Tracker</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter email"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 ${usernameError || backendUsernameError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`}
                />
              </div>
              {usernameError && <p className="text-red-600 text-sm mt-1">{usernameError}</p>}
              {!usernameError && backendUsernameError && <p className="text-red-600 text-sm mt-1">{backendUsernameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 tracking-widest ${passwordError || backendPasswordError ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`}
                />
              </div>
              {passwordError && <p className="text-red-600 text-sm mt-1">{passwordError}</p>}
              {!passwordError && backendPasswordError && <p className="text-red-600 text-sm mt-1">{backendPasswordError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 rounded-lg text-white gap-2 cursor-pointer ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"}`}
            >
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing In...</> : <><LogIn className="h-4 w-4" /> Sign In</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
