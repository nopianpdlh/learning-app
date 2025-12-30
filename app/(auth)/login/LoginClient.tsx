"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const authError = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch("email");

  // Translate common auth errors to Indonesian
  const translateAuthError = (errorMessage: string): string => {
    const errorMap: Record<string, string> = {
      "Invalid login credentials":
        "Email atau password salah. Silakan coba lagi.",
      "Email not confirmed":
        "Email belum diverifikasi. Silakan cek inbox email Anda.",
      "User already registered":
        "Email sudah terdaftar. Silakan login atau gunakan email lain.",
      "Password should be at least 6 characters":
        "Password minimal 6 karakter.",
      "Signup requires a valid password": "Password tidak valid.",
      "Unable to validate email address: invalid format":
        "Format email tidak valid.",
      "For security purposes, you can only request this once every 60 seconds":
        "Untuk keamanan, Anda hanya bisa request sekali per 60 detik.",
      "Email rate limit exceeded":
        "Terlalu banyak permintaan. Coba lagi nanti.",
      "A user with this email address has already been registered":
        "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
    };

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return errorMessage;
  };

  // Get auth error message from URL
  const getAuthErrorMessage = (): string | null => {
    if (!authError) return null;

    const errorMessages: Record<string, string> = {
      auth_failed: "Autentikasi gagal. Silakan coba lagi.",
      email_expired:
        "Link verifikasi email sudah kadaluarsa. Silakan minta link baru.",
      invalid_token: "Token tidak valid. Silakan login ulang.",
      oauth_failed:
        "Login dengan Google gagal. Silakan coba lagi atau gunakan email.",
      user_not_found: "Akun tidak ditemukan. Silakan daftar terlebih dahulu.",
      database_error: "Terjadi kesalahan sistem. Silakan coba lagi nanti.",
    };

    return errorMessages[authError] || "Terjadi kesalahan. Silakan coba lagi.";
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    setShowResendOption(false);

    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      const translatedError = translateAuthError(authError.message);

      // Check if it's an email not confirmed error
      if (
        authError.message.toLowerCase().includes("email not confirmed") ||
        authError.message.toLowerCase().includes("not verified")
      ) {
        setError(
          "Email belum diverifikasi. Silakan cek inbox email Anda atau kirim ulang link verifikasi."
        );
        setShowResendOption(true);
        setLastEmail(data.email);
      } else {
        setError(translatedError);
      }
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      const role = (
        authData.user.user_metadata?.role || "student"
      ).toLowerCase();
      router.push(`/${role}/dashboard`);
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError(translateAuthError(error.message));
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Gagal login dengan Google. Silakan coba lagi.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const authErrorMessage = getAuthErrorMessage();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/images/logo-tutor.svg"
            alt="Tutor Nomor Satu"
            width={80}
            height={80}
            className="opacity-90"
          />
        </div>
        <CardTitle className="text-2xl">Tutor Nomor Satu</CardTitle>
        <CardDescription>Masuk ke akun Anda untuk melanjutkan</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Success message after registration */}
          {registered && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registrasi berhasil! Silakan cek email Anda untuk verifikasi
                akun.
              </AlertDescription>
            </Alert>
          )}

          {/* Auth error from callback */}
          {authErrorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authErrorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Login error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Resend verification option */}
          {showResendOption && (
            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(
                    lastEmail || emailValue || ""
                  )}`}
                  className="font-medium underline hover:no-underline"
                >
                  Click here to resend verification email
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register now
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
