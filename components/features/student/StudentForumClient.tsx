"use client";

import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Reply,
  Clock,
  Send,
  Loader2,
  Search,
  Plus,
  CheckCircle,
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
  authorRole: string;
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
  createdAt: string;
  updatedAt: string;
  posts: Post[];
}

interface SectionInfo {
  id: string;
  name: string;
  subject: string;
}

interface Props {
  enrolledSections: SectionInfo[];
}

export default function StudentForumClient({ enrolledSections }: Props) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [replyText, setReplyText] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New thread form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSectionId, setNewSectionId] = useState("");

  // Fetch discussions
  useEffect(() => {
    fetchDiscussions();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [discussions, searchQuery, sectionFilter]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/forum/discussions");
      const data = await response.json();

      if (response.ok) {
        setDiscussions(data.discussions || []);
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

    // Section filter
    if (sectionFilter !== "all") {
      filtered = filtered.filter((d) => d.classId === sectionFilter);
    }

    setFilteredDiscussions(filtered);
  };

  const getStatusBadge = (hasTutorReply: boolean) => {
    return hasTutorReply ? (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-700 border-green-500/20"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Dijawab Tutor
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-700 border-orange-500/20"
      >
        Menunggu Jawaban
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
        await fetchDiscussions();
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

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim() || !newSectionId) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/forum/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          classId: newSectionId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Diskusi berhasil dibuat");
        setNewTitle("");
        setNewContent("");
        setNewSectionId("");
        setIsCreateOpen(false);
        await fetchDiscussions();
      } else {
        toast.error(data.error || "Gagal membuat diskusi");
      }
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Terjadi kesalahan saat membuat diskusi");
    } finally {
      setCreating(false);
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Forum Diskusi</h1>
          <p className="text-muted-foreground mt-1">
            Tanyakan dan diskusikan materi dengan tutor dan siswa lain
          </p>
        </div>

        {/* Create New Thread Button */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Diskusi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Buat Diskusi Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Kelas</label>
                <Select value={newSectionId} onValueChange={setNewSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Judul Diskusi</label>
                <Input
                  placeholder="Contoh: Cara mengerjakan soal latihan bab 3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Isi Pertanyaan</label>
                <Textarea
                  placeholder="Jelaskan pertanyaan Anda secara detail..."
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateThread}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Buat Diskusi
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <div className="text-2xl font-bold">{discussions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dijawab Tutor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {discussions.filter((d) => d.hasTutorReply).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menunggu Jawaban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {discussions.filter((d) => !d.hasTutorReply).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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

        {/* Section Filter */}
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {enrolledSections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Discussions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Daftar Diskusi</h3>
          {filteredDiscussions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada diskusi</p>
                <p className="text-sm mt-1">
                  Klik "Buat Diskusi Baru" untuk memulai
                </p>
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
                        {getStatusBadge(discussion.hasTutorReply)}
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
                      <div
                        key={post.id}
                        className={`flex gap-3 pl-4 border-l-2 ${
                          post.authorRole === "TUTOR"
                            ? "border-l-green-500 bg-green-50/50 -ml-4 pl-8 py-2 rounded-r-lg"
                            : ""
                        }`}
                      >
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
                            {post.authorRole === "TUTOR" && (
                              <Badge className="bg-green-500 text-xs">
                                Tutor
                              </Badge>
                            )}
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
                  <label className="text-sm font-medium">Tambah Balasan</label>
                  <Textarea
                    placeholder="Tulis balasan Anda..."
                    rows={4}
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
