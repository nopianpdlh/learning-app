"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Video,
  Calendar,
  Clock,
  Users,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const liveClasses = [
  {
    id: 1,
    title: "Matematika XII - Kalkulus Lanjut",
    date: "2024-03-25",
    time: "09:00 - 10:30",
    status: "upcoming",
    participants: 24,
    link: "https://meet.google.com/abc-defg-hij",
    class: "Matematika XII",
  },
  {
    id: 2,
    title: "Fisika XII - Mekanika Kuantum",
    date: "2024-03-25",
    time: "13:00 - 14:30",
    status: "upcoming",
    participants: 18,
    link: "https://meet.google.com/xyz-mnop-qrs",
    class: "Fisika XII",
  },
  {
    id: 3,
    title: "Matematika XI - Trigonometri",
    date: "2024-03-26",
    time: "10:00 - 11:30",
    status: "upcoming",
    participants: 22,
    link: "https://meet.google.com/tuv-wxyz-abc",
    class: "Matematika XI",
  },
  {
    id: 4,
    title: "Fisika XI - Dinamika",
    date: "2024-03-23",
    time: "14:00 - 15:30",
    status: "completed",
    participants: 20,
    recording: "https://drive.google.com/recording-1",
    class: "Fisika XI",
  },
  {
    id: 5,
    title: "Matematika XII - Integral",
    date: "2024-03-22",
    time: "09:00 - 10:30",
    status: "completed",
    participants: 24,
    recording: "https://drive.google.com/recording-2",
    class: "Matematika XII",
  },
];

export default function TutorLiveClasses() {
  const [filter, setFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const filteredClasses = liveClasses.filter((cls) => {
    if (filter === "all") return true;
    return cls.status === filter;
  });

  const getStatusBadge = (status: string) => {
    return status === "upcoming" ? (
      <Badge
        variant="outline"
        className="bg-blue-500/10 text-blue-700 border-blue-500/20"
      >
        Mendatang
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-700 border-gray-500/20"
      >
        Selesai
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link disalin!",
      description: "Link meeting berhasil disalin ke clipboard",
    });
  };

  const upcomingCount = liveClasses.filter(
    (c) => c.status === "upcoming"
  ).length;
  const completedCount = liveClasses.filter(
    (c) => c.status === "completed"
  ).length;
  const totalParticipants = liveClasses.reduce(
    (acc, c) => acc + c.participants,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Classes</h1>
          <p className="text-muted-foreground mt-1">
            Kelola jadwal dan link live classes
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Live Class Baru
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Live Class Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" placeholder="Nama live class..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Input id="class" placeholder="Pilih kelas..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Waktu</Label>
                <Input id="time" placeholder="09:00 - 10:30" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="link">Link Meeting</Label>
                <Input id="link" placeholder="https://meet.google.com/..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Batal
              </Button>
              <Button>Simpan Live Class</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Live Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveClasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {upcomingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {completedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Partisipan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalParticipants}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredClasses.map((liveClass) => (
            <Card
              key={liveClass.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {liveClass.title}
                        </h3>
                        {getStatusBadge(liveClass.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {liveClass.class}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(liveClass.date).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{liveClass.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{liveClass.participants} siswa</span>
                        </div>
                      </div>
                      {liveClass.link && (
                        <div className="flex items-center gap-2 pt-2">
                          <Input
                            value={liveClass.link}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(liveClass.link!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {liveClass.recording && (
                        <div className="pt-2">
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={liveClass.recording}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Lihat Rekaman
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 lg:shrink-0">
                    {liveClass.status === "upcoming" && (
                      <>
                        <Button asChild>
                          <a
                            href={liveClass.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Mulai Class
                          </a>
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
