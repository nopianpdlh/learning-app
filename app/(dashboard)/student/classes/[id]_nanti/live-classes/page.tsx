/**
 * Student Live Classes Page
 * View and join live classes for a specific enrolled class
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getLiveClassStatusColor,
  getLiveClassStatusText,
  getTimeUntil,
  formatDuration,
  isLiveNow,
  isUpcoming,
} from "@/lib/validations/liveclass.schema";

interface LiveClass {
  id: string;
  classId: string;
  className: string;
  tutorName: string;
  title: string;
  meetingUrl: string;
  scheduledAt: string;
  duration: number;
  createdAt: string;
}

export default function StudentLiveClassesPage() {
  const params = useParams();
  const classId = params.id as string;

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveClasses();
    // Refresh every minute to update status and countdown
    const interval = setInterval(fetchLiveClasses, 60000);
    return () => clearInterval(interval);
  }, [classId]);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/live-classes?classId=${classId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch live classes");
      }

      setLiveClasses(data.liveClasses);
      if (data.liveClasses.length > 0) {
        setClassName(data.liveClasses[0].className);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && liveClasses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading live classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchLiveClasses()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Separate live now, upcoming (within 24h), and future/past classes
  const now = new Date();
  const liveNowClasses = liveClasses.filter((lc) =>
    isLiveNow(new Date(lc.scheduledAt), lc.duration)
  );
  const upcomingClasses = liveClasses.filter(
    (lc) =>
      isUpcoming(new Date(lc.scheduledAt)) &&
      !isLiveNow(new Date(lc.scheduledAt), lc.duration)
  );
  const scheduledClasses = liveClasses.filter((lc) => {
    const date = new Date(lc.scheduledAt);
    return date > now && !isUpcoming(date) && !isLiveNow(date, lc.duration);
  });
  const pastClasses = liveClasses.filter((lc) => {
    const date = new Date(lc.scheduledAt);
    const endTime = new Date(date.getTime() + lc.duration * 60000);
    return endTime < now;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Live Classes</h1>
        <p className="text-gray-600 mt-2">{className}</p>
      </div>

      {/* Live Now Section */}
      {liveNowClasses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">
            🔴 Live Now
          </h2>
          <div className="space-y-4">
            {liveNowClasses.map((lc) => (
              <LiveClassCard key={lc.id} liveClass={lc} highlight />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming (within 24h) Section */}
      {upcomingClasses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📅 Starting Soon</h2>
          <div className="space-y-4">
            {upcomingClasses.map((lc) => (
              <LiveClassCard key={lc.id} liveClass={lc} />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled (future) Section */}
      {scheduledClasses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Scheduled Classes</h2>
          <div className="space-y-4">
            {scheduledClasses.map((lc) => (
              <LiveClassCard key={lc.id} liveClass={lc} />
            ))}
          </div>
        </div>
      )}

      {/* Past Classes Section */}
      {pastClasses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-500">
            Past Classes
          </h2>
          <div className="space-y-4">
            {pastClasses.slice(0, 5).map((lc) => (
              <LiveClassCard key={lc.id} liveClass={lc} isPast />
            ))}
          </div>
          {pastClasses.length > 5 && (
            <p className="text-gray-500 text-sm mt-4 text-center">
              Showing last 5 past classes
            </p>
          )}
        </div>
      )}

      {liveClasses.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No live classes scheduled yet.</p>
        </Card>
      )}
    </div>
  );
}

interface LiveClassCardProps {
  liveClass: LiveClass;
  highlight?: boolean;
  isPast?: boolean;
}

function LiveClassCard({ liveClass, highlight, isPast }: LiveClassCardProps) {
  const scheduledDate = new Date(liveClass.scheduledAt);
  const statusColor = getLiveClassStatusColor(
    scheduledDate,
    liveClass.duration
  );
  const statusText = getLiveClassStatusText(scheduledDate, liveClass.duration);
  const timeUntil = getTimeUntil(scheduledDate);
  const duration = formatDuration(liveClass.duration);
  const isLive = isLiveNow(scheduledDate, liveClass.duration);

  const cardClass = highlight
    ? "p-6 border-2 border-green-500 shadow-lg animate-pulse"
    : "p-6";

  return (
    <Card className={cardClass}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">{liveClass.title}</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
            >
              {statusText}
            </span>
          </div>

          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium">Instructor:</span>{" "}
              {liveClass.tutorName}
            </p>
            <p>
              <span className="font-medium">Scheduled:</span>{" "}
              {scheduledDate.toLocaleString("id-ID", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            <p>
              <span className="font-medium">Duration:</span> {duration}
            </p>

            {!isPast && (
              <>
                {isLive && (
                  <p className="text-green-600 font-bold text-lg">
                    🔴 Class is live now! Join to participate.
                  </p>
                )}
                {statusText === "UPCOMING" && (
                  <p className="text-yellow-600 font-medium">
                    ⏰ Starting in {timeUntil}
                  </p>
                )}
                {statusText === "SCHEDULED" && (
                  <p className="text-blue-600">Starts in {timeUntil}</p>
                )}
              </>
            )}
          </div>
        </div>

        {!isPast && (
          <div className="ml-4">
            <Button
              onClick={() => window.open(liveClass.meetingUrl, "_blank")}
              disabled={!isLive && !isUpcoming(scheduledDate)}
              className={isLive ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isLive ? "Join Now" : "View Meeting Link"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
