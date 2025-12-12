"use client";

import { useEffect, useState } from "react";

interface WelcomeMessageProps {
  userName: string;
  role: "admin" | "student" | "tutor";
}

export function WelcomeMessage({ userName, role }: WelcomeMessageProps) {
  const [greeting, setGreeting] = useState("Hello");
  const [emoji, setEmoji] = useState("👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
      setEmoji("☀️");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
      setEmoji("🌤️");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good evening");
      setEmoji("🌆");
    } else {
      setGreeting("Good night");
      setEmoji("🌙");
    }
  }, []);

  const getRoleSubtitle = () => {
    switch (role) {
      case "admin":
        return "Monitor your platform and manage operations";
      case "student":
        return "Ready to continue your learning journey?";
      case "tutor":
        return "Manage your classes and help your students succeed";
      default:
        return "Welcome to your dashboard";
    }
  };

  const firstName = userName?.split(" ")[0] || "User";

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <span>{greeting},</span>
        <span className="text-primary">{firstName}</span>
        <span>{emoji}</span>
      </h1>
      <p className="text-muted-foreground mt-1">{getRoleSubtitle()}</p>
    </div>
  );
}
