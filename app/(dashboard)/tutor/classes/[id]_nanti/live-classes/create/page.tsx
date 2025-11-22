/**
 * Create Live Class Page
 * Form for tutors to schedule a new live class
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateLiveClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [formData, setFormData] = useState({
    title: "",
    meetingUrl: "",
    scheduledAt: "",
    duration: 60,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create live class");
      }

      alert("Live class scheduled successfully! Students have been notified.");
      router.push(`/tutor/classes/${classId}/live-classes`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Schedule New Live Class</h1>
        <p className="text-gray-600 mt-2">
          Create a live class session for your students
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="title">Class Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Week 5: Advanced Functions"
              required
              minLength={3}
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              Give your live class a descriptive title
            </p>
          </div>

          <div>
            <Label htmlFor="meetingUrl">Meeting URL *</Label>
            <Input
              id="meetingUrl"
              name="meetingUrl"
              type="url"
              value={formData.meetingUrl}
              onChange={handleChange}
              placeholder="https://zoom.us/j/123456789 or https://meet.google.com/xxx-xxxx-xxx"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Only Zoom (zoom.us) or Google Meet (meet.google.com) links are
              accepted
            </p>
          </div>

          <div>
            <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Students will receive reminders 24 hours and 1 hour before the
              class
            </p>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              required
              min={15}
              max={480}
              step={15}
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum 15 minutes, maximum 8 hours (480 minutes)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Scheduling..." : "Schedule Live Class"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Reminder Settings</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Students will be notified immediately when you schedule this class
          </li>
          <li>• H-1 reminder: Sent 24 hours before the scheduled time</li>
          <li>• H-0 reminder: Sent 1 hour before the scheduled time</li>
          <li>
            • Students can join from their dashboard when the class is live
          </li>
        </ul>
      </div>
    </div>
  );
}
