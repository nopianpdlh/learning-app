"use client";

import { useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import { z } from "zod";
import {
  Loader2,
  Mail,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

type ForgotPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSentEmail(data.email);
      setSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
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
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to{" "}
            <strong>{sentEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Click the link in the email to reset your password. The link will
              expire in 1 hour.
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
            Try Different Email
          </Button>
          <Link href="/login" className="w-full">
            <Button className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
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
        <CardTitle className="text-2xl">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
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
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Reset Link
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
