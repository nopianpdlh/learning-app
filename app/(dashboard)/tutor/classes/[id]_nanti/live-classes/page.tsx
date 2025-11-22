/**
 * Tutor Live Classes Page
 * View and manage all live classes for a specific class
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getLiveClassStatusColor,
  getLiveClassStatusText,
  getTimeUntil,
  formatDuration,
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

export default function TutorLiveClassesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [className, setClassName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveClasses();
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

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this live class? Students will be notified of the cancellation."
      )
    ) {
      return;
    }

    try {
      setDeleteId(id);
      const response = await fetch(`/api/live-classes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete live class");
      }

      setLiveClasses(liveClasses.filter((lc) => lc.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
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

  // Separate upcoming and past classes
  const now = new Date();
  const upcomingClasses = liveClasses.filter(
    (lc) => new Date(lc.scheduledAt) > now
  );
  const pastClasses = liveClasses.filter(
    (lc) => new Date(lc.scheduledAt) <= now
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Live Classes</h1>
          <p className="text-gray-600 mt-2">{className}</p>
        </div>
        <Button
          onClick={() =>
            router.push(`/tutor/classes/${classId}/live-classes/create`)
          }
        >
          Schedule New Class
        </Button>
      </div>

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Classes</h2>
          <div className="space-y-4">
            {upcomingClasses.map((lc) => (
              <LiveClassCard
                key={lc.id}
                liveClass={lc}
                classId={classId}
                onDelete={handleDelete}
                isDeleting={deleteId === lc.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Classes */}
      {pastClasses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Classes</h2>
          <div className="space-y-4">
            {pastClasses.map((lc) => (
              <LiveClassCard
                key={lc.id}
                liveClass={lc}
                classId={classId}
                onDelete={handleDelete}
                isDeleting={deleteId === lc.id}
              />
            ))}
          </div>
        </div>
      )}

      {liveClasses.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No live classes scheduled yet.</p>
          <Button
            onClick={() =>
              router.push(`/tutor/classes/${classId}/live-classes/create`)
            }
          >
            Schedule Your First Class
          </Button>
        </Card>
      )}
    </div>
  );
}

interface LiveClassCardProps {
  liveClass: LiveClass;
  classId: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function LiveClassCard({
  liveClass,
  classId,
  onDelete,
  isDeleting,
}: LiveClassCardProps) {
  const router = useRouter();
  const scheduledDate = new Date(liveClass.scheduledAt);
  const statusColor = getLiveClassStatusColor(
    scheduledDate,
    liveClass.duration
  );
  const statusText = getLiveClassStatusText(scheduledDate, liveClass.duration);
  const timeUntil = getTimeUntil(scheduledDate);
  const duration = formatDuration(liveClass.duration);

  return (
    <Card className="p-6">
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
              <span className="font-medium">Scheduled:</span>{" "}
              {new Date(liveClass.scheduledAt).toLocaleString("id-ID", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            <p>
              <span className="font-medium">Duration:</span> {duration}
            </p>
            {statusText === "UPCOMING" && (
              <p className="text-yellow-600 font-medium">
                Starting in {timeUntil}
              </p>
            )}
            {statusText === "LIVE NOW" && (
              <p className="text-green-600 font-semibold">Class is live now!</p>
            )}
            <p>
              <span className="font-medium">Meeting Link:</span>{" "}
              <a
                href={liveClass.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {liveClass.meetingUrl.includes("zoom.us")
                  ? "Zoom"
                  : "Google Meet"}
              </a>
            </p>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/tutor/classes/${classId}/live-classes/${liveClass.id}/edit`
              )
            }
          >
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(liveClass.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
