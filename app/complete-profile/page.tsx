"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { PersonalStep, ProfileStep, TermsStep } from "@/components/auth/steps";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema for profile completion (steps 2, 3, 4 only)
const completeProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().optional().or(z.literal("")),
  gradeLevel: z.enum(["SD", "SMP", "SMA", "DEWASA"], {
    message: "Please select a grade level",
  }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service",
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the Privacy Policy",
  }),
  acceptMarketing: z.boolean().optional(),
});

type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

const steps = [
  { id: 1, name: "Personal", description: "Your information" },
  { id: 2, name: "Profile", description: "Student profile" },
  { id: 3, name: "Terms", description: "Accept policies" },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");

  const methods = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      phone: "",
      gradeLevel: undefined,
      acceptTerms: false,
      acceptPrivacy: false,
      acceptMarketing: false,
    },
  });

  const { handleSubmit, trigger, setValue } = methods;

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Pre-fill name from Google
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "";
      setUserName(name);
      setValue("name", name);
    };

    fetchUser();
  }, [router, setValue]);

  // Validate current step before proceeding
  const validateStep = async () => {
    let fieldsToValidate: (keyof CompleteProfileInput)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["name", "phone"];
        break;
      case 2:
        fieldsToValidate = ["gradeLevel"];
        break;
      case 3:
        fieldsToValidate = ["acceptTerms", "acceptPrivacy"];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CompleteProfileInput) => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
        return;
      }

      // Update profile via API
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: data.name,
          phone: data.phone || null,
          gradeLevel: data.gradeLevel,
          acceptTerms: data.acceptTerms,
          acceptPrivacy: data.acceptPrivacy,
          acceptMarketing: data.acceptMarketing,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to complete profile");
        setIsLoading(false);
        return;
      }

      toast.success("Profile completed successfully!");
      router.push("/student/dashboard");
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalStep />;
      case 2:
        return <ProfileStep />;
      case 3:
        return <TermsStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
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
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome {userName}! Please complete your profile to continue.
          </CardDescription>
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

                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
