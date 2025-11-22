/**
 * Edit Live Class Page
 * Form for tutors to update an existing live class
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditLiveClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const liveClassId = params.liveClassId as string;

  const [formData, setFormData] = useState({
    title: "",
    meetingUrl: "",
    scheduledAt: "",
    duration: 60,
  });
  const [originalScheduledAt, setOriginalScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveClass();
  }, [liveClassId]);

  const fetchLiveClass = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/live-classes/${liveClassId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch live class");
      }

      // Convert ISO string to datetime-local format
      const scheduledDate = new Date(data.scheduledAt);
      const localDateTime = new Date(
        scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);

      setFormData({
        title: data.title,
        meetingUrl: data.meetingUrl,
        scheduledAt: localDateTime,
        duration: data.duration,
      });
      setOriginalScheduledAt(data.scheduledAt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/live-classes/${liveClassId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update live class");
      }

      // Check if schedule changed
      const scheduleChanged =
        new Date(formData.scheduledAt).toISOString() !== originalScheduledAt;
      if (scheduleChanged) {
        alert(
          "Live class updated successfully! Students have been notified of the schedule change."
        );
      } else {
        alert("Live class updated successfully!");
      }

      router.push(`/tutor/classes/${classId}/live-classes`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value) || 0 : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading live class...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchLiveClass()}>Retry</Button>
        </div>
      </div>
    );
  }

  const scheduleChanged =
    formData.scheduledAt &&
    new Date(formData.scheduledAt).toISOString() !== originalScheduledAt;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Live Class</h1>
        <p className="text-gray-600 mt-2">Update your live class details</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {scheduleChanged && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <p className="font-semibold">Schedule Change Detected</p>
              <p className="text-sm mt-1">
                Students will be notified about the new schedule, and reminders
                will be updated.
              </p>
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
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
