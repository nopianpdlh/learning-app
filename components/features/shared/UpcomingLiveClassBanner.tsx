"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, ExternalLink, Users } from "lucide-react";
import { differenceInMinutes, differenceInHours, format } from "date-fns";

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

interface UpcomingLiveClassBannerProps {
  role: "admin" | "student" | "tutor";
  liveClass?: LiveClassData | null;
}

export function UpcomingLiveClassBanner({
  role,
  liveClass,
}: UpcomingLiveClassBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLive, setIsLive] = useState(false);
  const [isStartingSoon, setIsStartingSoon] = useState(false);

  useEffect(() => {
    if (!liveClass) return;

    const updateTime = () => {
      const now = new Date();
      const start = new Date(liveClass.startTime);
      const end = new Date(liveClass.endTime);

      if (now >= start && now <= end) {
        // Class is live
        setIsLive(true);
        setIsStartingSoon(false);
        const minsLeft = differenceInMinutes(end, now);
        setTimeRemaining(`${minsLeft} minutes remaining`);
      } else if (now < start) {
        // Class is upcoming
        setIsLive(false);
        const hoursLeft = differenceInHours(start, now);
        const minsLeft = differenceInMinutes(start, now) % 60;

        if (hoursLeft < 1) {
          setIsStartingSoon(true);
          setTimeRemaining(`Starts in ${minsLeft} min`);
        } else if (hoursLeft < 24) {
          setIsStartingSoon(hoursLeft < 2);
          setTimeRemaining(`Starts in ${hoursLeft}h ${minsLeft}m`);
        } else {
          setTimeRemaining(format(start, "MMM d 'at' HH:mm"));
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [liveClass]);

  if (!liveClass) return null;

  const getBannerStyle = () => {
    if (isLive) {
      return "bg-gradient-to-r from-red-600 to-red-500 text-white border-red-600";
    }
    if (isStartingSoon) {
      return "bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-500";
    }
    return "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600";
  };

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge
          variant="secondary"
          className="bg-white/20 text-white animate-pulse"
        >
          <span className="mr-1.5 h-2 w-2 rounded-full bg-white inline-block" />
          LIVE NOW
        </Badge>
      );
    }
    if (isStartingSoon) {
      return (
        <Badge variant="secondary" className="bg-white/20 text-white">
          <Clock className="mr-1 h-3 w-3" />
          Starting Soon
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-white/20 text-white">
        <Clock className="mr-1 h-3 w-3" />
        Upcoming
      </Badge>
    );
  };

  return (
    <Card className={`${getBannerStyle()} border-0 shadow-lg mb-6`}>
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge()}
              <span className="text-sm opacity-90">{timeRemaining}</span>
            </div>
            <h3 className="font-bold text-lg">
              {liveClass.title} - {liveClass.sectionLabel}
            </h3>
            {liveClass.tutorName && role !== "tutor" && (
              <p className="text-sm opacity-90">By {liveClass.tutorName}</p>
            )}
            {liveClass.participantCount !== undefined && role === "admin" && (
              <p className="text-sm opacity-90 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {liveClass.participantCount} participants
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {liveClass.meetingUrl && (role === "student" || role === "tutor") && (
            <Button
              asChild
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-white/90 flex-1 sm:flex-none"
            >
              <a
                href={liveClass.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {isLive ? "Join Now" : "Open Meeting"}
              </a>
            </Button>
          )}
          <Button
            asChild
            variant="ghost"
            className="text-white hover:bg-white/20 flex-1 sm:flex-none"
          >
            <Link href={`/${role}/liveClasses`}>View All Classes</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
