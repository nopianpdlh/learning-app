"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
  link?: string;
  linkText?: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  storageKey: string; // e.g., "admin_alerts", "student_alerts"
}

export function AlertBanner({ alerts, storageKey }: AlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load dismissed alerts from sessionStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem(`dismissed_${storageKey}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [storageKey]);

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter((alert) => !dismissedIds.has(alert.id));

  const handleDismiss = (alertId: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(alertId);
    setDismissedIds(newDismissed);

    // Save to sessionStorage
    sessionStorage.setItem(
      `dismissed_${storageKey}`,
      JSON.stringify(Array.from(newDismissed))
    );
  };

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted || visibleAlerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-800",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200",
          text: "text-amber-800",
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        };
      case "info":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-800",
          icon: <Info className="h-5 w-5 text-blue-500" />,
        };
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {visibleAlerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center justify-between gap-4 p-3 rounded-lg border",
              styles.bg
            )}
          >
            <div className="flex items-center gap-3">
              {styles.icon}
              <p className={cn("text-sm font-medium", styles.text)}>
                {alert.message}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {alert.link && (
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className={cn("h-7 text-xs", styles.text)}
                >
                  <Link href={alert.link}>{alert.linkText || "Lihat"}</Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(alert.id)}
                className="h-7 w-7 p-0 hover:bg-white/50"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AlertBanner;
