"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/app/auth/_components/Button";
import { Input } from "@/app/auth/_components/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoWithText, { GoogleIcon } from "@/components/icons/icons";
import ReCAPTCHA from "react-google-recaptcha";
import { Loader } from "lucide-react";

export default function SignInPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Reverted to single error state

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Redirect authenticated users
  useEffect(() => {
    const getRedirectDestination = async () => {
      try {
        const response = await fetch("/api/auth/redirect");
        if (response.ok) {
          const { redirectTo } = await response.json();
          return redirectTo;
        }
      } catch (error) {
        console.error("Error getting redirect destination:", error);
      }
      return "/onboarding";
    };

    if (status === "authenticated" && session?.user?.id) {
      getRedirectDestination().then((redirectTo) => {
        router.push(redirectTo);
      });
    }
  }, [session, status, router]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    await signIn("google");
  };

  // Step 1: Send OTP to the user's email
  const handleEmailSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (siteKey && !recaptchaToken) {
      setError("Please complete the reCAPTCHA.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError("Failed to send OTP");
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        return;
      }

      setIsNewUser(data.isNewUser || false);
      setStep("otp");
    } catch (error) {
      setError("An error occurred. Please try again.");
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP (and name if new user) and sign in
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((isNewUser && !name) || !otp) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("otp", {
        email,
        otp,
        name: isNewUser ? name : undefined,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid OTP. Try again or resend.");
      }
      // On success, the useEffect will handle redirection
    } catch (err) {
      setError("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between py-10 min-h-screen font-sans bg-background">
      <div>
        <div className="w-full flex items-center justify-center mb-0">
          <LogoWithText />
        </div>
        <h2 className="text-center text-muted-foreground mb-6 text-md italic">
          All your newsletters in one place
        </h2>
      </div>

      <div className="w-full max-w-[385px] px-4">
        <p className="text-center text-muted-foreground text-md mt-4 mb-2">
          Get started - Sign-in or create an account
        </p>

        <Button
          onClick={handleGoogleSignIn}
          variant="social"
          className="w-full mb-3"
          disabled={loading}
        >
          <GoogleIcon className="mr-2.5 h-5 w-5" /> Continue with Google
        </Button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hovered"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-3 text-muted-foreground">Or</span>
          </div>
        </div>

        {error && (
          <div className="p-3 my-2 text-sm text-center text-red-600 ">
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            {siteKey && (
              <div className="flex justify-center">
                <div className="relative rounded-xl">
                  <div className="rounded-xl overflow-hidden">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={siteKey}
                      onChange={setRecaptchaToken}
                    />
                  </div>
                  <div className="absolute inset-[-15px] rounded-xl border-x-[20px] border-y-[0px] h-20 mt-[14px] border-recaptcha pointer-events-none"></div>
                  <div className="absolute inset-x-[-24px] inset-y-[-1px] rounded-xl border-x-[15px] border-y-[10px] border-recaptcha pointer-events-none"></div>
                </div>
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !email || (siteKey && !recaptchaToken)}
            >
              {loading ? "Sending..." : "Continue with Email"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              disabled
              className="bg-secondary cursor-not-allowed"
            />
            {isNewUser && (
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            )}
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={loading}
              maxLength={6}
              minLength={6}
              required
              autoComplete="one-time-code"
              inputMode="numeric"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={loading || otp.length !== 6 || (isNewUser && !name)}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => handleEmailSubmit()}
                disabled={loading}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-8 text-center">
        By continuing you agree to the <br />
        <Link href="/terms" className="underline hover:text-primary">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
