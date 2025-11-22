"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ThumbsUp, Reply, Clock, Send } from "lucide-react";

const discussions = [
  {
    id: 1,
    author: "Ahmad Rizki",
    class: "Matematika XII",
    title: "Pertanyaan tentang Integral Parsial",
    content:
      "Pak, saya masih bingung dengan konsep integral parsial. Kapan kita harus menggunakan metode ini?",
    replies: 3,
    likes: 5,
    time: "2 jam yang lalu",
    status: "unanswered",
  },
  {
    id: 2,
    author: "Siti Nurhaliza",
    class: "Fisika XII",
    title: "Penjelasan Gelombang Elektromagnetik",
    content:
      "Apakah gelombang elektromagnetik memerlukan medium untuk merambat? Mohon penjelasannya.",
    replies: 5,
    likes: 8,
    time: "5 jam yang lalu",
    status: "answered",
  },
  {
    id: 3,
    author: "Budi Santoso",
    class: "Matematika XI",
    title: "Soal Trigonometri no. 15",
    content:
      "Saya tidak mengerti langkah penyelesaian soal no. 15 di LKS. Bisa dijelaskan step by step?",
    replies: 2,
    likes: 3,
    time: "1 hari yang lalu",
    status: "unanswered",
  },
  {
    id: 4,
    author: "Dewi Lestari",
    class: "Fisika XI",
    title: "Praktikum Dinamika",
    content:
      "Untuk praktikum minggu depan, apakah boleh dikerjakan berkelompok?",
    replies: 1,
    likes: 2,
    time: "1 hari yang lalu",
    status: "answered",
  },
];

export default function TutorForum() {
  const [selectedDiscussion, setSelectedDiscussion] = useState<number | null>(
    null
  );
  const [replyText, setReplyText] = useState("");

  const getStatusBadge = (status: string) => {
    return status === "unanswered" ? (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-700 border-orange-500/20"
      >
        Belum Dijawab
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-700 border-green-500/20"
      >
        Terjawab
      </Badge>
    );
  };

  const unansweredCount = discussions.filter(
    (d) => d.status === "unanswered"
  ).length;
  const totalReplies = discussions.reduce((acc, d) => acc + d.replies, 0);
  const totalLikes = discussions.reduce((acc, d) => acc + d.likes, 0);

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
      <div className="grid gap-4 md:grid-cols-4">
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
              Belum Dijawab
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unansweredCount}
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
              {totalReplies}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalLikes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Discussions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Daftar Diskusi</h3>
          {discussions.map((discussion) => (
            <Card
              key={discussion.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedDiscussion === discussion.id
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setSelectedDiscussion(discussion.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {discussion.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">
                          {discussion.author}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {discussion.class}
                        </p>
                      </div>
                      {getStatusBadge(discussion.status)}
                    </div>
                    <h4 className="font-semibold">{discussion.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {discussion.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Reply className="h-4 w-4" />
                        <span>{discussion.replies}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{discussion.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{discussion.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Discussion Detail & Reply */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Detail Diskusi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDiscussion ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>
                        {discussions
                          .find((d) => d.id === selectedDiscussion)
                          ?.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">
                          {
                            discussions.find((d) => d.id === selectedDiscussion)
                              ?.author
                          }
                        </p>
                        {getStatusBadge(
                          discussions.find((d) => d.id === selectedDiscussion)
                            ?.status || ""
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {
                          discussions.find((d) => d.id === selectedDiscussion)
                            ?.class
                        }{" "}
                        •{" "}
                        {
                          discussions.find((d) => d.id === selectedDiscussion)
                            ?.time
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">
                      {
                        discussions.find((d) => d.id === selectedDiscussion)
                          ?.title
                      }
                    </h4>
                    <p className="text-sm">
                      {
                        discussions.find((d) => d.id === selectedDiscussion)
                          ?.content
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Button variant="ghost" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {
                        discussions.find((d) => d.id === selectedDiscussion)
                          ?.likes
                      }
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      {
                        discussions.find((d) => d.id === selectedDiscussion)
                          ?.replies
                      }{" "}
                      balasan
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium">Balas Diskusi</label>
                  <Textarea
                    placeholder="Tulis balasan Anda..."
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Balasan
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
