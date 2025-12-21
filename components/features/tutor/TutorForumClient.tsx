"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Reply,
  Clock,
  Send,
  Loader2,
  Pin,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar: string | null;
  authorId: string;
  className: string;
  classId: string;
  subject: string;
  replyCount: number;
  hasTutorReply: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  posts: Post[];
}

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
}

interface Stats {
  total: number;
  unanswered: number;
  totalReplies: number;
}

export default function TutorForumClient() {
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>(
    []
  );
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    unanswered: 0,
    totalReplies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyText, setReplyText] = useState("");

  // Fetch discussions
  useEffect(() => {
    fetchDiscussions();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [discussions, searchQuery, classFilter, statusFilter]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/tutor/forum/discussions?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setDiscussions(data.discussions);
        setStats(data.stats);
        setClasses(data.classes);
      } else {
        toast.error(data.error || "Gagal memuat diskusi");
      }
    } catch (error) {
      console.error("Error fetching discussions:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...discussions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.content.toLowerCase().includes(query) ||
          d.authorName.toLowerCase().includes(query) ||
          d.className.toLowerCase().includes(query)
      );
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((d) => d.classId === classFilter);
    }

    // Status filter (client-side for search/class filter compatibility)
    if (statusFilter === "unanswered") {
      filtered = filtered.filter((d) => !d.hasTutorReply);
    } else if (statusFilter === "answered") {
      filtered = filtered.filter((d) => d.hasTutorReply);
    }

    setFilteredDiscussions(filtered);
  };

  const getStatusBadge = (hasTutorReply: boolean) => {
    return hasTutorReply ? (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-700 border-green-500/20"
      >
        Terjawab
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-700 border-orange-500/20"
      >
        Belum Dijawab
      </Badge>
    );
  };

  const handleSelectDiscussion = (discussionId: string) => {
    setSelectedDiscussion(discussionId);
    setReplyText("");
  };

  const handleReply = async () => {
    if (!selectedDiscussion || !replyText.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }

    const discussion = discussions.find((d) => d.id === selectedDiscussion);
    if (!discussion) return;

    setReplying(true);
    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: selectedDiscussion,
          content: replyText.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Balasan berhasil dikirim");
        setReplyText("");
        // Refresh discussions
        await fetchDiscussions();
        // Keep the discussion selected
        setSelectedDiscussion(selectedDiscussion);
      } else {
        toast.error(data.error || "Gagal mengirim balasan");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Terjadi kesalahan saat mengirim balasan");
    } finally {
      setReplying(false);
    }
  };

  const selectedThread = discussions.find((d) => d.id === selectedDiscussion);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Forum Diskusi</h1>
        <p className="text-muted-foreground mt-1">
          Kelola diskusi dan jawab pertanyaan siswa
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Diskusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Belum Dijawab
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.unanswered}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balasan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalReplies}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari diskusi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Class Filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="unanswered">Belum Dijawab</TabsTrigger>
            <TabsTrigger value="answered">Terjawab</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Discussions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Daftar Diskusi</h3>
          {filteredDiscussions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada diskusi ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            filteredDiscussions.map((discussion) => (
              <Card
                key={discussion.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedDiscussion === discussion.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleSelectDiscussion(discussion.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={discussion.authorAvatar || undefined} />
                      <AvatarFallback>
                        {discussion.authorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">
                            {discussion.authorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {discussion.className}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {discussion.isPinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          {getStatusBadge(discussion.hasTutorReply)}
                        </div>
                      </div>
                      <h4 className="font-semibold">{discussion.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {discussion.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Reply className="h-4 w-4" />
                          <span>{discussion.replyCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(
                              new Date(discussion.updatedAt),
                              {
                                addSuffix: true,
                                locale: localeId,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Discussion Detail & Reply */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Detail Diskusi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedThread ? (
              <>
                {/* Thread Header */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage
                        src={selectedThread.authorAvatar || undefined}
                      />
                      <AvatarFallback>
                        {selectedThread.authorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">
                          {selectedThread.authorName}
                        </p>
                        {getStatusBadge(selectedThread.hasTutorReply)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedThread.className} • {selectedThread.subject} •{" "}
                        {formatDistanceToNow(
                          new Date(selectedThread.createdAt),
                          {
                            addSuffix: true,
                            locale: localeId,
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">
                      {selectedThread.title}
                    </h4>
                    <p className="text-sm">{selectedThread.content}</p>
                  </div>

                  {/* Reply Count */}
                  <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{selectedThread.replyCount} balasan</span>
                  </div>
                </div>

                {/* All Replies */}
                {selectedThread.posts.length > 1 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h5 className="font-semibold text-sm">Balasan</h5>
                    {selectedThread.posts.slice(1).map((post) => (
                      <div key={post.id} className="flex gap-3 pl-4 border-l-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.authorAvatar || undefined} />
                          <AvatarFallback>
                            {post.authorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">
                              {post.authorName}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                                locale: localeId,
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">Balas Diskusi</label>
                  <Textarea
                    placeholder="Tulis balasan Anda..."
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                  >
                    {replying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Kirim Balasan
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Pilih diskusi untuk melihat detail</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
