"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Mail } from "lucide-react";
import { TermsModal } from "@/components/legal/TermsModal";
import { PrivacyModal } from "@/components/legal/PrivacyModal";

export function TermsStep() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const acceptTerms = watch("acceptTerms");
  const acceptPrivacy = watch("acceptPrivacy");
  const acceptMarketing = watch("acceptMarketing");

  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Terms & Conditions</h2>
        <p className="text-sm text-muted-foreground">
          Please review and accept our policies
        </p>
      </div>

      <div className="space-y-4">
        {/* Terms of Service */}
        <div className="flex items-start space-x-3 p-4 rounded-lg border">
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setValue("acceptTerms", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptTerms"
              className="flex items-center gap-2 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-primary" />
              Terms of Service <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              I agree to the{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => setTermsOpen(true)}
              >
                Terms of Service
              </Button>
            </p>
          </div>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">
            {errors.acceptTerms.message as string}
          </p>
        )}

        {/* Privacy Policy */}
        <div className="flex items-start space-x-3 p-4 rounded-lg border">
          <Checkbox
            id="acceptPrivacy"
            checked={acceptPrivacy}
            onCheckedChange={(checked) => setValue("acceptPrivacy", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptPrivacy"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Shield className="h-4 w-4 text-primary" />
              Privacy Policy <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              I agree to the{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => setPrivacyOpen(true)}
              >
                Privacy Policy
              </Button>
            </p>
          </div>
        </div>
        {errors.acceptPrivacy && (
          <p className="text-sm text-red-600">
            {errors.acceptPrivacy.message as string}
          </p>
        )}

        {/* Marketing Consent (Optional) */}
        <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
          <Checkbox
            id="acceptMarketing"
            checked={acceptMarketing}
            onCheckedChange={(checked) => setValue("acceptMarketing", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptMarketing"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Updates (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              I want to receive news, promotions, and learning tips via email
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </div>
  );
}
