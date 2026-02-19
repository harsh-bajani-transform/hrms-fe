import { useEffect, useState, type FormEvent } from "react";
import {
  Lock,
  Loader2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { verifyResetToken, resetPassword } from "../../services/authService";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
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

type ViewState = "verifying" | "invalid" | "form" | "success";

const ResetPasswordView = () => {
  const [viewState, setViewState] = useState<ViewState>("verifying");
  const [token, setToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [newPasswordError, setNewPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string>("");

  const navigate = useNavigate();
  const { device_id, device_type } = useDeviceInfo();

  // Extract token from URL and verify it
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get("token");

    if (!tokenFromUrl) {
      setViewState("invalid");
      setTokenError(
        "No reset token found in the URL. Please use the link from your email.",
      );
      return;
    }

    setToken(tokenFromUrl);
    verifyToken(tokenFromUrl);
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    setViewState("verifying");
    try {
      const response = await verifyResetToken(
        tokenToVerify,
        device_id,
        device_type,
      );

      if (response.status === 200 && response.data?.user_id) {
        setViewState("form");
        setTokenError("");
        toast.success(
          "Token verified successfully. Please set your new password.",
          {
            duration: 4000,
          },
        );
      } else {
        setViewState("invalid");
        setTokenError(
          "Invalid or expired reset link. Please request a new password reset.",
        );
        toast.error("Invalid or expired reset link", { duration: 4000 });
      }
    } catch (error) {
      setViewState("invalid");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Link expired or invalid. Please try again.";
      setTokenError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const handleNewPasswordChange = (value: string): void => {
    setNewPassword(value);

    if (!value.trim()) {
      setNewPasswordError("Please enter your new password");
    } else if (value.length < 6) {
      setNewPasswordError("Password must be at least 6 characters");
    } else {
      setNewPasswordError("");
    }

    // Also validate confirm password if it has been touched
    if (confirmPassword) {
      if (value !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleConfirmPasswordChange = (value: string): void => {
    setConfirmPassword(value);

    if (!value.trim()) {
      setConfirmPasswordError("Please confirm your password");
    } else if (value !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Final validation
    if (!newPassword || !confirmPassword) {
      if (!newPassword) {
        setNewPasswordError("Please enter your new password");
      }
      if (!confirmPassword) {
        setConfirmPasswordError("Please confirm your password");
      }
      toast.error("Please fill in all fields", { duration: 3000 });
      return;
    }

    if (newPasswordError || confirmPasswordError) {
      toast.error("Please fix the errors before submitting", {
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      toast.error("Passwords do not match", { duration: 3000 });
      return;
    }

    setIsResetting(true);

    try {
      const response = await resetPassword(
        token,
        newPassword,
        device_id,
        device_type,
      );

      if (response.status === 200) {
        setViewState("success");
        toast.success("Password reset successfully! Redirecting to login...", {
          duration: 4000,
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate({ to: "/", replace: true });
        }, 2000);
      } else {
        toast.error("Failed to reset password. Please try again.", {
          duration: 4000,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.";
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate({ to: "/", replace: true });
  };

  // Loading State
  if (viewState === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardContent className="flex flex-col items-center justify-center space-y-4 p-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Verifying Reset Link...
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Please wait while we verify your password reset link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State (Invalid/Expired Token)
  if (viewState === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-lg mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Link Expired
            </h1>
            <p className="text-gray-600">
              Your password reset link has expired or is invalid
            </p>
          </div>

          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardContent className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm text-center">
                  {tokenError ||
                    "The password reset link is no longer valid. Please request a new password reset."}
                </p>
              </div>

              <Button
                onClick={handleBackToLogin}
                className="w-full  bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} TransForm Solutions. All rights
            reserved.
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (viewState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

        <div className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl shadow-lg mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600">
              Your password has been reset successfully
            </p>
          </div>

          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardContent className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm text-center">
                  Redirecting you to the login page...
                </p>
              </div>

              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-6">
            © {new Date().getFullYear()} TransForm Solutions. All rights
            reserved.
          </p>
        </div>
      </div>
    );
  }

  // Form State (Password Reset Form)
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-white to-blue-50">
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-md relative">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Set New Password
            </CardTitle>
            <CardDescription className="text-center text-base">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* New Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="Enter new password"
                    className={` pl-10 pr-10 text-base ${
                      newPasswordError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    disabled={isResetting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {newPasswordError && (
                  <p className="text-sm text-red-600 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{newPasswordError}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) =>
                      handleConfirmPasswordChange(e.target.value)
                    }
                    placeholder="Confirm new password"
                    className={` pl-10 pr-10 text-base ${
                      confirmPasswordError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    disabled={isResetting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-red-600 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{confirmPasswordError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isResetting}
                className="w-full  bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-sm mt-6"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
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

export default ResetPasswordView;
