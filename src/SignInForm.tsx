"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

type AuthMethod = "password" | "otp";
type PasswordFlow = "signIn" | "signUp" | "email-verification";
type OTPStep = "email" | "code";
type ResetStep = "forgot" | "reset-verification";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [passwordFlow, setPasswordFlow] = useState<PasswordFlow>("signIn");
  const [otpStep, setOtpStep] = useState<OTPStep>("email");
  const [resetStep, setResetStep] = useState<ResetStep>("forgot");
  const [otpEmail, setOtpEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [passwordSignUpEmail, setPasswordSignUpEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    
    if (passwordFlow === "signUp") {
      // For sign-up, first send OTP for email verification
      formData.set("flow", "signUp");
      try {
        const result = await signIn("password", formData);
        // If signingIn is false, email verification is required
        if (!result.signingIn) {
          setPasswordSignUpEmail(email);
          setPasswordFlow("email-verification");
          toast.success("Verification code sent to your email");
          setSubmitting(false);
        } else {
          // Sign-up successful without verification (shouldn't happen with verify configured)
          setSubmitting(false);
        }
      } catch (error: any) {
        // If error indicates verification needed, handle it
        if (error.message?.includes("verification") || error.message?.includes("code")) {
          setPasswordSignUpEmail(email);
          setPasswordFlow("email-verification");
          toast.success("Verification code sent to your email");
          setSubmitting(false);
        } else {
          toast.error("Could not sign up. Please try again.");
          setSubmitting(false);
        }
      }
    } else {
      // For sign-in, proceed normally
      formData.set("flow", "signIn");
      try {
        await signIn("password", formData);
      } catch {
        toast.error("Could not sign in. Please check your credentials.");
        setSubmitting(false);
      }
    }
  };

  const handlePasswordVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("email", passwordSignUpEmail);
    formData.set("flow", "email-verification");
    
    try {
      await signIn("password", formData);
    } catch {
      toast.error("Invalid verification code. Please try again.");
      setSubmitting(false);
    }
  };

  const handleOTPEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    
    try {
      await signIn("resend-otp", formData);
      setOtpEmail(email);
      setOtpStep("code");
      toast.success("Verification code sent to your email");
      setSubmitting(false);
    } catch {
      toast.error("Could not send verification code. Please try again.");
      setSubmitting(false);
    }
  };

  const handleOTPCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("email", otpEmail);
    
    try {
      await signIn("resend-otp", formData);
    } catch {
      toast.error("Invalid verification code. Please try again.");
      setSubmitting(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    formData.set("flow", "reset");
    
    try {
      await signIn("password", formData);
      setResetEmail(email);
      setResetStep("reset-verification");
      toast.success("Password reset code sent to your email");
      setSubmitting(false);
    } catch {
      toast.error("Could not send reset code. Please check your email.");
      setSubmitting(false);
    }
  };

  const handleResetVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("email", resetEmail);
    formData.set("flow", "reset-verification");
    
    try {
      await signIn("password", formData);
    } catch {
      toast.error("Invalid code or password. Please try again.");
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signIn("google");
    } catch {
      toast.error("Could not sign in with Google. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Auth Method Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("password");
            setPasswordFlow("signIn");
            setResetStep("forgot");
            setPasswordSignUpEmail("");
          }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            authMethod === "password"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("otp");
            setOtpStep("email");
            setOtpEmail("");
          }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            authMethod === "otp"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Email Code
        </button>
      </div>

      {/* Password Auth - Sign In/Sign Up */}
      {authMethod === "password" && resetStep === "forgot" && passwordFlow !== "email-verification" && (
        <>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              void handlePasswordSubmit(e);
            }}
          >
            <input
              className="auth-input-field"
              type="email"
              name="email"
              placeholder="Email"
              required
              key={passwordFlow}
            />
            <div className="relative">
              <input
                className="auth-input-field pr-10"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              className="auth-button"
              type="submit"
              disabled={submitting}
            >
              {passwordFlow === "signIn" ? "Sign in" : "Sign up"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
                onClick={() => {
                  setPasswordFlow(passwordFlow === "signIn" ? "signUp" : "signIn");
                  setPasswordSignUpEmail("");
                }}
              >
                {passwordFlow === "signIn" ? "Sign up instead" : "Sign in instead"}
              </button>
              <button
                type="button"
                className="text-gray-600 hover:text-gray-800 hover:underline"
                onClick={() => setResetStep("reset-verification")}
              >
                Forgot password?
              </button>
            </div>
          </form>
        </>
      )}

      {/* Password Sign-Up Email Verification */}
      {authMethod === "password" && passwordFlow === "email-verification" && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            void handlePasswordVerification(e);
          }}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Verification code sent to:</span> {passwordSignUpEmail}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Please check your email and enter the code below to complete your sign-up.
            </p>
          </div>
          <input
            className="auth-input-field"
            type="text"
            name="code"
            placeholder="Verification Code"
            required
            maxLength={8}
            autoComplete="off"
          />
          <button
            className="auth-button"
            type="submit"
            disabled={submitting}
          >
            Verify & Complete Sign Up
          </button>
          <button
            type="button"
            className="text-sm text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer text-center"
            onClick={() => {
              setPasswordFlow("signUp");
              setPasswordSignUpEmail("");
            }}
          >
            Use a different email
          </button>
        </form>
      )}

      {/* Password Reset Flow */}
      {authMethod === "password" && resetStep === "reset-verification" && (
        <>
          {!resetEmail ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                void handleResetRequest(e);
              }}
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll send you a code to reset your password.
                </p>
              </div>
              <input
                className="auth-input-field"
                type="email"
                name="email"
                placeholder="Email"
                required
              />
              <button
                className="auth-button"
                type="submit"
                disabled={submitting}
              >
                Send Reset Code
              </button>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer text-center"
                onClick={() => {
                  setResetStep("forgot");
                  setResetEmail("");
                }}
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                void handleResetVerification(e);
              }}
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Reset code sent to:</span> {resetEmail}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please check your email and enter the code below along with your new password.
                </p>
              </div>
              <input
                className="auth-input-field"
                type="text"
                name="code"
                placeholder="Reset Code"
                required
                maxLength={8}
                autoComplete="off"
              />
              <div className="relative">
                <input
                  className="auth-input-field pr-10"
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="New Password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                className="auth-button"
                type="submit"
                disabled={submitting}
              >
                Reset Password
              </button>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer text-center"
                onClick={() => {
                  setResetEmail("");
                }}
              >
                Resend code
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline text-center"
                onClick={() => {
                  setResetStep("forgot");
                  setResetEmail("");
                }}
              >
                Cancel
              </button>
            </form>
          )}
        </>
      )}

      {/* OTP Auth */}
      {authMethod === "otp" && (
        <>
          {otpStep === "email" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                void handleOTPEmailSubmit(e);
              }}
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Sign in with Email Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email and we'll send you a verification code.
                </p>
              </div>
              <input
                className="auth-input-field"
                type="email"
                name="email"
                placeholder="Email"
                required
                key="otp-email-input"
              />
              <button
                className="auth-button"
                type="submit"
                disabled={submitting}
              >
                Send Code
              </button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                void handleOTPCodeSubmit(e);
              }}
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Verification code sent to:</span> {otpEmail}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please check your email and enter the code below to sign in.
                </p>
              </div>
              <input
                className="auth-input-field"
                type="text"
                name="code"
                placeholder="Verification Code"
                required
                maxLength={8}
                autoComplete="off"
                key="otp-code-input"
              />
              <button
                className="auth-button"
                type="submit"
                disabled={submitting}
              >
                Verify & Sign In
              </button>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer text-center"
                onClick={() => {
                  setOtpStep("email");
                  setOtpEmail("");
                }}
              >
                Use a different email
              </button>
            </form>
          )}
        </>
      )}

      {/* Divider */}
      <div className="flex items-center justify-center my-4">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-sm text-gray-500">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>

      {/* Google OAuth */}
      <button
        className="auth-button flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow transition-all"
        onClick={() => {
          void handleGoogleSignIn();
        }}
        disabled={submitting}
        type="button"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
