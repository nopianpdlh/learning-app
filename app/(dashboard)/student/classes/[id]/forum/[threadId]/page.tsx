/**
 * Forum Thread Detail Page
 * View thread with all posts and replies
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTimeAgo } from "@/lib/validations/forum.schema";

interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies: ForumPost[];
}

interface ThreadDetail {
  id: string;
  classId: string;
  className: string;
  authorId: string;
  authorName: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  posts: ForumPost[];
  totalPosts: number;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forum/threads/${threadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch thread");
      }

      setThread(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setPosting(true);
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          content: replyContent,
          parentId: replyingTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post reply");
      }

      // Refresh thread
      await fetchThread();
      setReplyContent("");
      setReplyingTo(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading thread...</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Thread not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Thread Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back to Forum
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {thread.isPinned && <span className="text-blue-600">📌</span>}
              <h1 className="text-3xl font-bold">{thread.title}</h1>
            </div>
            <p className="text-gray-600">
              Started by {thread.authorName} •{" "}
              {getTimeAgo(new Date(thread.createdAt))} • {thread.totalPosts}{" "}
              posts
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 mb-8">
        {thread.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReply={(postId) => {
              setReplyingTo(postId);
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            }}
          />
        ))}
      </div>

      {/* Reply Form */}
      <Card className="p-6">
        <form onSubmit={handlePostReply} className="space-y-4">
          {replyingTo && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded flex items-center justify-between">
              <span className="text-blue-800 text-sm">
                Replying to a specific post
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
            </div>
          )}

          <div>
            <Label htmlFor="reply">Your Reply</Label>
            <textarea
              id="reply"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              required
              minLength={1}
              maxLength={5000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {replyContent.length}/5000 characters
            </p>
          </div>

          <Button type="submit" disabled={posting || !replyContent.trim()}>
            {posting ? "Posting..." : "Post Reply"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

interface PostCardProps {
  post: ForumPost;
  onReply: (postId: string) => void;
  level?: number;
}

function PostCard({ post, onReply, level = 0 }: PostCardProps) {
  const marginLeft = level > 0 ? `${level * 2}rem` : "0";

  return (
    <div style={{ marginLeft }}>
      <Card className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-sm text-gray-500">
              {getTimeAgo(new Date(post.createdAt))}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onReply(post.id)}>
            Reply
          </Button>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>
      </Card>

      {/* Nested Replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {post.replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
