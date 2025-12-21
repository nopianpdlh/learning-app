"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, isSameDay } from "date-fns";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "class" | "assignment" | "quiz" | "meeting";
}

interface MiniCalendarProps {
  events?: CalendarEvent[];
  role: "admin" | "student" | "tutor";
}

export function MiniCalendar({ events = [], role }: MiniCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Get events for selected date
  const selectedDateEvents = events.filter(
    (event) => date && isSameDay(event.date, date)
  );

  // Get dates that have events for highlighting
  const eventDates = events.map((e) => e.date);

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "class":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assignment":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "quiz":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "meeting":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScheduleLink = () => {
    switch (role) {
      case "admin":
        return "/admin/schedule";
      case "student":
        return "/student/sections";
      case "tutor":
        return "/tutor/sections";
      default:
        return "/";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href={getScheduleLink()}>View All</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border-0 p-0"
          modifiers={{
            hasEvent: eventDates,
          }}
          modifiersClassNames={{
            hasEvent: "bg-primary/10 font-bold text-primary",
          }}
        />

        {/* Events for selected date */}
        {date && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium mb-2">
              {format(date, "MMMM d, yyyy")}
            </p>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No events scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-2 rounded border ${getEventTypeColor(
                      event.type
                    )}`}
                  >
                    <p className="font-medium">{event.title}</p>
                    <p className="opacity-75 capitalize">{event.type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
