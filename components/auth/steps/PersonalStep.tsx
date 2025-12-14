"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone } from "lucide-react";

export function PersonalStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground">
          Tell us a bit about yourself
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            className="pl-10"
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className="text-sm text-red-600">
            {errors.name.message as string}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="+62812345678"
            className="pl-10"
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-red-600">
            {errors.phone.message as string}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          We&apos;ll use this to send important updates
        </p>
      </div>
    </div>
  );
}
