"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Copy,
  ExternalLink,
  Loader2,
  Search,
  Download,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { format, addMinutes, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface LiveClass {
  id: string;
  title: string;
  meetingUrl: string;
  scheduledAt: string;
  duration: number;
  classId: string;
  className: string;
  classSubject: string;
  enrollmentCount: number;
  status: "upcoming" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
}

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  totalEnrollments: number;
}

export default function TutorLiveClassesClient() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<LiveClass[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    totalEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [nextClassCountdown, setNextClassCountdown] = useState<string | null>(
    null
  );

  // Fetch live classes
  useEffect(() => {
    fetchLiveClasses();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [liveClasses, statusFilter, classFilter, searchQuery, sortBy, sortOrder]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdown();
    }, 60000); // Every minute

    updateCountdown(); // Initial update

    return () => clearInterval(interval);
  }, [liveClasses]);

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tutor/liveClasses");
      const data = await response.json();

      if (response.ok) {
        setLiveClasses(data.liveClasses);
        setStats(data.stats);
        setClasses(data.classes);
      } else {
        toast.error(data.error || "Gagal memuat live classes");
      }
    } catch (error) {
      console.error("Error fetching live classes:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...liveClasses];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lc) => lc.status === statusFilter);
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((lc) => lc.classId === classFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lc) =>
          lc.title.toLowerCase().includes(query) ||
          lc.className.toLowerCase().includes(query) ||
          lc.classSubject.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.scheduledAt).getTime();
        const dateB = new Date(b.scheduledAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // Sort by title
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });

    setFilteredClasses(filtered);
  };

  const updateCountdown = () => {
    const upcomingClasses = liveClasses
      .filter((lc) => lc.status === "upcoming")
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

    if (upcomingClasses.length > 0) {
      const nextClass = upcomingClasses[0];
      const distance = formatDistanceToNow(new Date(nextClass.scheduledAt), {
        addSuffix: false,
        locale: localeId,
      });
      setNextClassCountdown(distance);
    } else {
      setNextClassCountdown(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link disalin ke clipboard");
  };

  const copyClassInfo = (liveClass: LiveClass) => {
    const scheduledAt = new Date(liveClass.scheduledAt);
    const endTime = addMinutes(scheduledAt, liveClass.duration);
    const info = `📅 ${liveClass.className} - ${liveClass.title}
⏰ ${format(scheduledAt, "dd MMM yyyy, HH:mm", {
      locale: localeId,
    })} - ${format(endTime, "HH:mm")}
👥 ${liveClass.enrollmentCount} siswa
🔗 ${liveClass.meetingUrl}`;

    navigator.clipboard.writeText(info);
    toast.success("Info live class disalin ke clipboard");
  };

  const exportToCalendar = (liveClass: LiveClass) => {
    const scheduledAt = new Date(liveClass.scheduledAt);
    const endTime = addMinutes(scheduledAt, liveClass.duration);

    // Format dates for .ics file
    const formatDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Learning App//Live Class//EN
BEGIN:VEVENT
UID:${liveClass.id}@learningapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(scheduledAt)}
DTEND:${formatDate(endTime)}
SUMMARY:${liveClass.title}
DESCRIPTION:${liveClass.className}\\n\\nMeeting URL: ${liveClass.meetingUrl}
LOCATION:${liveClass.meetingUrl}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${liveClass.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("File calendar berhasil diunduh");
  };

  const getNextClass = () => {
    const upcomingClasses = liveClasses
      .filter((lc) => lc.status === "upcoming")
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    return upcomingClasses[0] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextClass = getNextClass();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Live Classes</h1>
        <p className="text-muted-foreground mt-1">
          Jadwal dan link live classes Anda
        </p>
      </div>

      {/* Next Class Countdown */}
      {nextClass && nextClassCountdown && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Next Class:</h3>
                  <p className="text-sm text-muted-foreground">
                    {nextClass.title}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Dimulai dalam {nextClassCountdown}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => copyClassInfo(nextClass)}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Info
                </Button>
                <Button size="sm" asChild>
                  <a
                    href={nextClass.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Mulai Class
                  </a>
                </Button>
              </div>
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
            <div className="text-2xl font-bold">{stats.total}</div>
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
              {stats.upcoming}
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
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalEnrollments}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4">
        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search, Class Filter, Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari live class..."
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

          {/* Sort */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [by, order] = value.split("-") as [
                typeof sortBy,
                typeof sortOrder
              ];
              setSortBy(by);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Tanggal (Terlama)</SelectItem>
              <SelectItem value="date-desc">Tanggal (Terbaru)</SelectItem>
              <SelectItem value="title-asc">Judul (A-Z)</SelectItem>
              <SelectItem value="title-desc">Judul (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live Classes List */}
      <div className="space-y-4">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada live class ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((liveClass) => {
            const scheduledAt = new Date(liveClass.scheduledAt);
            const endTime = addMinutes(scheduledAt, liveClass.duration);

            return (
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
                          <Badge
                            variant="outline"
                            className={
                              liveClass.status === "upcoming"
                                ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                : "bg-gray-500/10 text-gray-700 border-gray-500/20"
                            }
                          >
                            {liveClass.status === "upcoming"
                              ? "Mendatang"
                              : "Selesai"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {liveClass.className} • {liveClass.classSubject}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(scheduledAt, "dd MMM yyyy", {
                                locale: localeId,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(scheduledAt, "HH:mm")} -{" "}
                              {format(endTime, "HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{liveClass.enrollmentCount} siswa</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Input
                            value={liveClass.meetingUrl}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(liveClass.meetingUrl)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyClassInfo(liveClass)}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Copy Info
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToCalendar(liveClass)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      {liveClass.status === "upcoming" && (
                        <Button size="sm" asChild>
                          <a
                            href={liveClass.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Mulai Class
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
