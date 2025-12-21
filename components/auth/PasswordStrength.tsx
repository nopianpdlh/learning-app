"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;

    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character type checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Determine strength level
    if (score <= 2) {
      return { score: 1, label: "Weak", color: "bg-red-500" };
    } else if (score <= 4) {
      return { score: 2, label: "Medium", color: "bg-yellow-500" };
    } else {
      return { score: 3, label: "Strong", color: "bg-green-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              level <= strength.score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs font-medium",
          strength.score === 1 && "text-red-500",
          strength.score === 2 && "text-yellow-600",
          strength.score === 3 && "text-green-600"
        )}
      >
        Password strength: {strength.label}
      </p>
    </div>
  );
}
