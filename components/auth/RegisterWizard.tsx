"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth.schema";
import { AccountStep, PersonalStep, ProfileStep, TermsStep } from "./steps";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Account", description: "Create login credentials" },
  { id: 2, name: "Personal", description: "Your information" },
  { id: 3, name: "Profile", description: "Student profile" },
  { id: 4, name: "Terms", description: "Accept policies" },
];

export function RegisterWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const methods = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      gradeLevel: undefined,
      acceptTerms: false,
      acceptPrivacy: false,
      acceptMarketing: false,
    },
  });

  const { handleSubmit, trigger, getValues } = methods;

  // Validate current step before proceeding
  const validateStep = async () => {
    let fieldsToValidate: (keyof RegisterInput)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["email", "password", "confirmPassword"];
        break;
      case 2:
        fieldsToValidate = ["name", "phone"];
        break;
      case 3:
        fieldsToValidate = ["gradeLevel"];
        break;
      case 4:
        fieldsToValidate = ["acceptTerms", "acceptPrivacy"];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    // Guard: Only submit if on step 4 and terms are accepted
    if (currentStep !== 4) {
      // If user accidentally triggers submit (e.g., via Enter key), go to next step instead
      nextStep();
      return;
    }

    // Validate terms are accepted
    if (!data.acceptTerms || !data.acceptPrivacy) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);

    // Translate Supabase errors to Indonesian
    const translateError = (msg: string): string => {
      const errorMap: Record<string, string> = {
        "User already registered":
          "Email sudah terdaftar. Silakan login atau gunakan email lain.",
        "A user with this email address has already been registered":
          "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
        "Password should be at least 6 characters":
          "Password minimal 6 karakter.",
        "Unable to validate email address: invalid format":
          "Format email tidak valid.",
        "Signup requires a valid password": "Password tidak valid.",
        "Email rate limit exceeded":
          "Terlalu banyak permintaan. Coba lagi nanti.",
        "For security purposes, you can only request this once every 60 seconds":
          "Untuk keamanan, Anda hanya bisa request sekali per 60 detik.",
      };

      for (const [key, value] of Object.entries(errorMap)) {
        if (msg.toLowerCase().includes(key.toLowerCase())) {
          return value;
        }
      }
      return msg;
    };

    try {
      const supabase = createClient();

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: data.name,
            phone: data.phone,
            role: "student",
          },
        },
      });

      if (authError) {
        toast.error(translateError(authError.message));
        setIsLoading(false);
        return;
      }

      // Check if user already exists but not confirmed (Supabase returns user without session)
      if (authData.user && !authData.session) {
        // Check if this is a "fake" signup (user exists but unconfirmed email returned)
        const identities = authData.user.identities;
        if (identities && identities.length === 0) {
          toast.error(
            "Email ini sudah terdaftar. Silakan login atau gunakan email lain."
          );
          setIsLoading(false);
          return;
        }
      }

      if (authData.user) {
        // Create user record in database via API route
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: authData.user.id,
            email: data.email,
            name: data.name,
            phone: data.phone || null,
            role: "STUDENT",
            gradeLevel: data.gradeLevel,
            acceptMarketing: data.acceptMarketing,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(
            errorData.error || "Gagal membuat akun. Silakan coba lagi."
          );
          setIsLoading(false);
          return;
        }

        // Show success and redirect
        toast.success(
          "Akun berhasil dibuat! Silakan cek email Anda untuk verifikasi."
        );
        router.push("/login?registered=true");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/student/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to login with Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AccountStep />;
      case 2:
        return <PersonalStep />;
      case 3:
        return <ProfileStep />;
      case 4:
        return <TermsStep />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <Image
            src="/images/logo-tutor.svg"
            alt="Tutor Nomor Satu"
            width={64}
            height={64}
            className="opacity-90"
          />
        </div>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Join Tutor Nomor Satu today</CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center",
                  currentStep >= step.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    currentStep > step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs mt-1 hidden sm:block">
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          {/* Progress line */}
          <div className="relative h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Google Login (only on step 1) */}
        {currentStep === 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
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

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(currentStep === 1 && "invisible")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-0">
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
