"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function ResendVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromParams);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        if (resendError.message.includes("already confirmed")) {
          setError("This email is already verified. You can login now.");
        } else {
          setError(resendError.message);
        }
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Resend error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Email Sent!</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification email to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Please check your inbox and click the verification link to
              activate your account. The link will expire in 24 hours.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p>Didn&apos;t receive the email?</p>
            <ul className="list-disc list-inside text-left">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSuccess(false)}
          >
            Resend Again
          </Button>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/images/logo-tutor.svg"
            alt="Tutor Nomor Satu"
            width={64}
            height={64}
            className="opacity-90"
          />
        </div>
        <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
        <CardDescription>
          Enter your email to receive a new verification link
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleResend}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Why verify?</p>
            <p>
              Email verification helps secure your account and ensures you can
              recover access if you forget your password.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Verification Email
              </>
            )}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
