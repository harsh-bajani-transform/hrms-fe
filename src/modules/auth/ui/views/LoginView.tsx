import { useEffect, useState, type FormEvent } from "react";
import { Mail, Lock, LogIn, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { loginUser, forgotPassword } from "../../services/authService";
import { useAuth, type User } from "../../../../context/AuthContext";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import { log, logError } from "../../../../config/environment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const asRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const extractUserFromLoginResponse = (data: unknown): User | null => {
  if (!data) return null;

  // Case 1: response.data is already the user object
  if (asRecord(data) && ("user_id" in data || "id" in data)) {
    return data as User;
  }

  // Case 2: response.data is an envelope with { data: user } or { user: user }
  if (asRecord(data) && "data" in data && asRecord(data.data)) {
    return data.data as User;
  }

  if (asRecord(data) && "user" in data && asRecord(data.user)) {
    return data.user as User;
  }

  return null;
};

const LoginView = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Frontend validation errors
  const [usernameError, setUsernameError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // Backend field-specific errors
  const [backendUsernameError, setBackendUsernameError] = useState<string>("");
  const [backendPasswordError, setBackendPasswordError] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();

  // Redirect logged-in users away from login page
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, navigate]);

  const handleUsernameChange = (value: string): void => {
    setUsername(value);
    setBackendUsernameError("");

    if (!value.trim()) {
      setUsernameError("Please enter your email");
    } else if (!isValidEmail(value)) {
      setUsernameError("Please enter a valid email address");
    } else {
      setUsernameError("");
    }
  };

  const handlePasswordChange = (value: string): void => {
    setPassword(value);
    setBackendPasswordError("");

    if (!value.trim()) {
      setPasswordError("Please enter your password");
    } else if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Final validation check
    if (usernameError || passwordError || !username || !password) {
      if (!username) setUsernameError("Please enter your email");
      if (!password) setPasswordError("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser(
        username,
        password,
        device_id,
        device_type,
      );
      log("[LoginPage] Login successful");

      const extracted = extractUserFromLoginResponse(response.data);

      if (!extracted || (extracted.user_id == null && extracted.id == null)) {
        throw new Error("Invalid response format from backend");
      }

      if (extracted.is_active === 0 || extracted.is_active === false) {
        toast.error("Your account is inactive. Please contact your admin.", {
          duration: 5000,
        });
        return;
      }

      login(extracted);
      toast.success("You are now logged in!", { duration: 4000 });

      // Role-based navigation
      const roleId = Number(extracted.role_id);
      if (roleId === 6) {
        // Agents go to agent dashboard
        navigate({ to: "/agent", replace: true });
      } else {
        // All other roles go to main dashboard
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: unknown) {
      logError("[LoginPage] Login failed:", err);

      const message =
        err instanceof Error ? err.message : "Invalid credentials";

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

  const handleForgotPassword = async (): Promise<void> => {
    // Validate email is entered
    if (!username.trim()) {
      setUsernameError("Please enter your email to reset password");
      toast.error("Please enter your email address", { duration: 3000 });
      return;
    }

    // Validate email format
    if (!isValidEmail(username)) {
      setUsernameError("Please enter a valid email address");
      toast.error("Please enter a valid email address", { duration: 3000 });
      return;
    }

    setIsSendingResetLink(true);

    try {
      const response = await forgotPassword(username, device_id, device_type);

      if (response.status === 200) {
        toast.success(
          "Password reset link has been sent to your email. Please check your inbox and spam folder.",
          { duration: 6000 },
        );
      } else {
        toast.error("Failed to send reset link. Please try again.", {
          duration: 4000,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send reset link. Please try again.";
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSendingResetLink(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-md relative">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TFS Ops Tracker
          </h1>
          <p className="text-gray-600">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="you@company.com"
                    className={`h-11 pl-10 pr-4 text-base ${
                      usernameError || backendUsernameError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {(usernameError || backendUsernameError) && (
                  <p className="text-sm text-red-600 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{usernameError || backendUsernameError}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    className={`h-11 pl-10 pr-4 text-base ${
                      passwordError || backendPasswordError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {(passwordError || backendPasswordError) && (
                  <p className="text-sm text-red-600 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{passwordError || backendPasswordError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-sm mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingResetLink}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingResetLink ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sending reset link...
                    </span>
                  ) : (
                    "Forgot Password?"
                  )}
                </button>
              </div>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                Having trouble signing in? Contact your administrator for
                assistance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © {new Date().getFullYear()} TransForm Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
