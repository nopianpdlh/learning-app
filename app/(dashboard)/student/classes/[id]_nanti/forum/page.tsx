/**
 * Forum Threads Page
 * View all forum threads for a class
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getTimeAgo,
  getThreadBadgeColor,
} from "@/lib/validations/forum.schema";

interface ForumThread {
  id: string;
  classId: string;
  authorId: string;
  authorName: string;
  title: string;
  isPinned: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ForumPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "oldest" | "mostReplies">(
    "recent"
  );

  useEffect(() => {
    fetchThreads();
  }, [classId, sort]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/forum/threads?classId=${classId}&sort=${sort}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch forum threads");
      }

      setThreads(data.threads);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading forum...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchThreads()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Separate pinned and regular threads
  const pinnedThreads = threads.filter((t) => t.isPinned);
  const regularThreads = threads.filter((t) => !t.isPinned);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Class Forum</h1>
          <p className="text-gray-600 mt-2">
            Discuss topics and ask questions with your classmates
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/student/classes/${classId}/forum/create`)
          }
        >
          New Thread
        </Button>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSort("recent")}
          className={`px-4 py-2 rounded ${
            sort === "recent"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setSort("oldest")}
          className={`px-4 py-2 rounded ${
            sort === "oldest"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Oldest
        </button>
        <button
          onClick={() => setSort("mostReplies")}
          className={`px-4 py-2 rounded ${
            sort === "mostReplies"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Most Replies
        </button>
      </div>

      {/* Pinned Threads */}
      {pinnedThreads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📌 Pinned Threads
          </h2>
          <div className="space-y-3">
            {pinnedThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} classId={classId} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Threads */}
      {regularThreads.length > 0 ? (
        <div className="space-y-3">
          {regularThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} classId={classId} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">
            No threads yet. Be the first to start a discussion!
          </p>
          <Button
            onClick={() =>
              router.push(`/student/classes/${classId}/forum/create`)
            }
          >
            Create First Thread
          </Button>
        </Card>
      )}
    </div>
  );
}

interface ThreadCardProps {
  thread: ForumThread;
  classId: string;
}

function ThreadCard({ thread, classId }: ThreadCardProps) {
  const router = useRouter();
  const badgeColor = getThreadBadgeColor(thread.isPinned, thread.replyCount);
  const timeAgo = getTimeAgo(new Date(thread.updatedAt));

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() =>
        router.push(`/student/classes/${classId}/forum/${thread.id}`)
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {thread.isPinned && <span className="text-blue-600">📌</span>}
            <h3 className="text-lg font-semibold">{thread.title}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>By {thread.authorName}</span>
            <span>•</span>
            <span>
              {thread.replyCount}{" "}
              {thread.replyCount === 1 ? "reply" : "replies"}
            </span>
            <span>•</span>
            <span>Last activity {timeAgo}</span>
          </div>
        </div>
        <div>
          <span className={`px-3 py-1 rounded-full text-sm ${badgeColor}`}>
            {thread.replyCount} replies
          </span>
        </div>
      </div>
    </Card>
  );
}
