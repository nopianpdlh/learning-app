"use client";

import { UpcomingLiveClassBanner } from "@/components/features/shared/UpcomingLiveClassBanner";
import { WelcomeMessage } from "@/components/features/shared/WelcomeMessage";
import { MiniCalendar } from "@/components/features/shared/MiniCalendar";

interface LiveClassData {
  id: string;
  title: string;
  sectionLabel: string;
  tutorName?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  participantCount?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "class" | "assignment" | "quiz" | "meeting";
}

interface AdminDashboardHeaderProps {
  userName: string;
  upcomingLiveClass: LiveClassData | null;
  calendarEvents: CalendarEvent[];
}

export function AdminDashboardHeader({
  userName,
  upcomingLiveClass,
  calendarEvents,
}: AdminDashboardHeaderProps) {
  return (
    <>
      {/* Welcome Message */}
      <WelcomeMessage userName={userName} role="admin" />

      {/* Upcoming Live Class Banner */}
      <UpcomingLiveClassBanner role="admin" liveClass={upcomingLiveClass} />
    </>
  );
}

export function AdminDashboardCalendar({
  calendarEvents,
}: {
  calendarEvents: CalendarEvent[];
}) {
  return <MiniCalendar events={calendarEvents} role="admin" />;
}
