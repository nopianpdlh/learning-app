"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap } from "lucide-react";

const gradeLevels = [
  { value: "SD", label: "SD (Elementary School)", description: "Ages 6-12" },
  { value: "SMP", label: "SMP (Junior High)", description: "Ages 12-15" },
  { value: "SMA", label: "SMA (Senior High)", description: "Ages 15-18" },
  { value: "DEWASA", label: "Dewasa (Adult)", description: "Ages 18+" },
];

export function ProfileStep() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const currentGradeLevel = watch("gradeLevel");

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Student Profile</h2>
        <p className="text-sm text-muted-foreground">
          Help us personalize your learning experience
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradeLevel">Grade Level</Label>
        <Select
          value={currentGradeLevel}
          onValueChange={(value) => setValue("gradeLevel", value)}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select your grade level" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {gradeLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <div className="flex flex-col">
                  <span>{level.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {level.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.gradeLevel && (
          <p className="text-sm text-red-600">
            {errors.gradeLevel.message as string}
          </p>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <h3 className="font-medium text-sm mb-2">Why we ask this?</h3>
        <p className="text-sm text-muted-foreground">
          Your grade level helps us recommend suitable courses and learning
          materials tailored to your educational stage.
        </p>
      </div>
    </div>
  );
}
