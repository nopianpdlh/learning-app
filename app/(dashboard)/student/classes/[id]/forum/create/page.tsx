/**
 * Create Forum Thread Page
 * Form to create a new discussion thread
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateThreadPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create thread");
      }

      router.push(`/student/classes/${classId}/forum/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Thread</h1>
        <p className="text-gray-600 mt-2">Start a new discussion topic</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="title">Thread Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or topic?"
              required
              minLength={5}
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              Be clear and descriptive (5-200 characters)
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
              {loading ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Forum Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be respectful and courteous to others</li>
          <li>• Stay on topic and relevant to the class</li>
          <li>• Use clear and descriptive thread titles</li>
          <li>• Search before posting to avoid duplicates</li>
        </ul>
      </div>
    </div>
  );
}
