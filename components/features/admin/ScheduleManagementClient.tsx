"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCombobox } from "@/components/features/admin/SectionCombobox";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Video,
  Clock,
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

// Types
interface Section {
  id: string;
  sectionLabel: string;
  currentEnrollments: number;
  tutor: {
    id: string;
    user: {
      name: string;
    };
    availability: {
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };
  template: {
    name: string;
    maxStudentsPerSection: number;
  };
}

interface ScheduledMeeting {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  scheduledAt: Date | string;
  duration: number;
  meetingUrl: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  createdBy: string;
  recordingUrl: string | null;
  section: Section;
}

interface ScheduleManagementClientProps {
  meetings: ScheduledMeeting[];
  sections: Section[];
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ScheduleManagementClient({
  meetings: initialMeetings,
  sections,
}: ScheduleManagementClientProps) {
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(initialMeetings);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(
    null
  );
  const [cancellingMeeting, setCancellingMeeting] =
    useState<ScheduledMeeting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conflictCheck, setConflictCheck] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    sectionId: "",
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "90",
    meetingUrl: "",
    recordingUrl: "",
  });

  // Filter meetings
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.section.template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    scheduled: meetings.filter((m) => m.status === "SCHEDULED").length,
    live: meetings.filter((m) => m.status === "LIVE").length,
    completed: meetings.filter((m) => m.status === "COMPLETED").length,
    cancelled: meetings.filter((m) => m.status === "CANCELLED").length,
  };

  const resetForm = () => {
    setFormData({
      sectionId: "",
      title: "",
      description: "",
      date: "",
      time: "",
      duration: "90",
      meetingUrl: "",
      recordingUrl: "",
    });
    setConflictCheck(null);
  };

  // Check for conflicts when section/date/time changes
  const checkConflict = async () => {
    if (!formData.sectionId || !formData.date || !formData.time) {
      setConflictCheck(null);
      return;
    }

    const section = sections.find((s) => s.id === formData.sectionId);
    if (!section) return;

    const scheduledDate = new Date(`${formData.date}T${formData.time}`);
    const dayOfWeek = scheduledDate.getDay();
    const timeStr = formData.time;
    const isPastMeeting = scheduledDate < new Date();

    // Skip tutor availability check for past meetings when editing
    if (!isPastMeeting || !editingMeeting) {
      // Check tutor availability
      const tutorAvailable = section.tutor.availability.some((a) => {
        if (a.dayOfWeek !== dayOfWeek) return false;
        return a.startTime <= timeStr && a.endTime > timeStr;
      });

      if (!tutorAvailable) {
        setConflictCheck({
          valid: false,
          message: `Tutor ${section.tutor.user.name} tidak tersedia di ${DAYS[dayOfWeek]} jam ${timeStr}`,
        });
        return;
      }
    }

    // Check for conflicting meetings (same tutor, same time)
    const conflictingMeeting = meetings.find((m) => {
      if (editingMeeting && m.id === editingMeeting.id) return false;
      if (m.status === "CANCELLED") return false;

      const meetingDate = new Date(m.scheduledAt);
      const meetingEnd = new Date(meetingDate.getTime() + m.duration * 60000);
      const newMeetingStart = scheduledDate;
      const newMeetingEnd = new Date(
        newMeetingStart.getTime() + parseInt(formData.duration) * 60000
      );

      // Same tutor, overlapping time
      if (m.section.tutor.id === section.tutor.id) {
        return (
          (newMeetingStart >= meetingDate && newMeetingStart < meetingEnd) ||
          (newMeetingEnd > meetingDate && newMeetingEnd <= meetingEnd) ||
          (newMeetingStart <= meetingDate && newMeetingEnd >= meetingEnd)
        );
      }
      return false;
    });

    if (conflictingMeeting) {
      setConflictCheck({
        valid: false,
        message: `Bentrok dengan meeting "${conflictingMeeting.title}" di Section ${conflictingMeeting.section.sectionLabel}`,
      });
      return;
    }

    // For past meetings being edited, show appropriate message
    if (isPastMeeting && editingMeeting) {
      setConflictCheck({
        valid: true,
        message: `Meeting sudah terlewat. Anda bisa edit recording URL.`,
      });
      return;
    }

    setConflictCheck({
      valid: true,
      message: `Tutor ${section.tutor.user.name} tersedia. ${section.currentEnrollments} siswa enrolled.`,
    });
  };

  // Run conflict check when relevant fields change using useEffect
  useEffect(() => {
    checkConflict();
  }, [formData.sectionId, formData.date, formData.time, formData.duration]);

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictCheck?.valid) {
      toast.error("Ada konflik jadwal. Periksa kembali.");
      return;
    }
    setIsLoading(true);

    try {
      const scheduledAt = new Date(
        `${formData.date}T${formData.time}`
      ).toISOString();

      const response = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: formData.sectionId,
          title: formData.title,
          description: formData.description || null,
          scheduledAt,
          duration: parseInt(formData.duration),
          meetingUrl: formData.meetingUrl || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create meeting");
      }

      const newMeeting = await response.json();
      setMeetings([newMeeting, ...meetings]);

      toast.success("Meeting berhasil dijadwalkan");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal membuat meeting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setIsLoading(true);

    try {
      const scheduledAt = new Date(
        `${formData.date}T${formData.time}`
      ).toISOString();

      const response = await fetch(`/api/admin/schedule/${editingMeeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          scheduledAt,
          duration: parseInt(formData.duration),
          meetingUrl: formData.meetingUrl || null,
          recordingUrl: formData.recordingUrl || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update meeting");

      const updatedMeeting = await response.json();
      setMeetings(
        meetings.map((m) => (m.id === editingMeeting.id ? updatedMeeting : m))
      );

      toast.success("Meeting berhasil diupdate");
      setIsEditDialogOpen(false);
      setEditingMeeting(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate meeting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!cancellingMeeting) return;

    try {
      const response = await fetch(
        `/api/admin/schedule/${cancellingMeeting.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );

      if (!response.ok) throw new Error("Failed to cancel meeting");

      setMeetings(
        meetings.map((m) =>
          m.id === cancellingMeeting.id
            ? { ...m, status: "CANCELLED" as const }
            : m
        )
      );

      toast.success("Meeting dibatalkan");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membatalkan meeting");
    } finally {
      setCancellingMeeting(null);
    }
  };

  const openEditDialog = (meeting: ScheduledMeeting) => {
    const date = new Date(meeting.scheduledAt);
    setEditingMeeting(meeting);
    setFormData({
      sectionId: meeting.sectionId,
      title: meeting.title,
      description: meeting.description || "",
      date: date.toISOString().split("T")[0],
      time: date.toTimeString().substring(0, 5),
      duration: meeting.duration.toString(),
      meetingUrl: meeting.meetingUrl || "",
      recordingUrl: meeting.recordingUrl || "",
    });
    setIsEditDialogOpen(true);
    setTimeout(() => checkConflict(), 100);
  };

  const formatDateTime = (dateInput: Date | string) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge className="bg-blue-100 text-blue-800">Terjadwal</Badge>;
      case "LIVE":
        return (
          <Badge className="bg-green-100 text-green-800 animate-pulse">
            🔴 Live
          </Badge>
        );
      case "COMPLETED":
        return <Badge className="bg-gray-100 text-gray-800">Selesai</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Form Component
  const MeetingForm = ({
    onSubmit,
    isEditing,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    isEditing: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isEditing && (
        <div className="space-y-2">
          <Label>Section *</Label>
          <Select
            value={formData.sectionId}
            onValueChange={(value) => handleFormChange("sectionId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih section" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[300px]">
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.template.name} - Section {section.sectionLabel} (
                  {section.tutor.user.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Judul Meeting *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Pertemuan ke-1: Introduction"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Materi yang akan dibahas..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tanggal *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => handleFormChange("date", e.target.value)}
            min={isEditing ? undefined : new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Waktu *</Label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => handleFormChange("time", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Durasi (menit)</Label>
          <Select
            value={formData.duration}
            onValueChange={(value) =>
              setFormData({ ...formData, duration: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="60">60 menit</SelectItem>
              <SelectItem value="90">90 menit</SelectItem>
              <SelectItem value="120">120 menit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Meeting URL</Label>
          <Input
            value={formData.meetingUrl}
            onChange={(e) =>
              setFormData({ ...formData, meetingUrl: e.target.value })
            }
            placeholder="https://zoom.us/..."
          />
        </div>
        {/* Recording URL - only show when editing */}
        {isEditing && (
          <div className="space-y-2">
            <Label>Recording URL (untuk meeting selesai)</Label>
            <Input
              value={formData.recordingUrl}
              onChange={(e) =>
                setFormData({ ...formData, recordingUrl: e.target.value })
              }
              placeholder="https://youtube.com/... atau link rekaman lainnya"
            />
            <p className="text-xs text-muted-foreground">
              Siswa yang tidak hadir bisa menonton rekaman ini
            </p>
          </div>
        )}
      </div>

      {/* Conflict Check Result */}
      {conflictCheck && (
        <div
          className={`p-3 rounded-lg flex items-start gap-2 ${
            conflictCheck.valid
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {conflictCheck.valid ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              conflictCheck.valid ? "text-green-800" : "text-red-800"
            }`}
          >
            {conflictCheck.message}
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#FFB800] hover:bg-[#e6a600] text-black"
          disabled={isLoading || (!isEditing && !conflictCheck?.valid)}
        >
          {isLoading
            ? "Loading..."
            : isEditing
            ? "Update Meeting"
            : "Jadwalkan Meeting"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2647]">Jadwal Meeting</h1>
          <p className="text-muted-foreground">
            Kelola jadwal meeting kelas dengan pengecekan konflik
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#FFB800] hover:bg-[#e6a600] text-black"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Jadwalkan Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Jadwalkan Meeting Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMeeting} className="space-y-4">
              <div className="space-y-2">
                <Label>Section *</Label>
                <SectionCombobox
                  sections={sections}
                  value={formData.sectionId}
                  onValueChange={(value) =>
                    handleFormChange("sectionId", value)
                  }
                  placeholder="Pilih section..."
                />
              </div>

              <div className="space-y-2">
                <Label>Judul Meeting *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Pertemuan ke-1: Introduction"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Materi yang akan dibahas..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tanggal *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Waktu *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleFormChange("time", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durasi (menit)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="60">60 menit</SelectItem>
                      <SelectItem value="90">90 menit</SelectItem>
                      <SelectItem value="120">120 menit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Meeting URL</Label>
                  <Input
                    value={formData.meetingUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingUrl: e.target.value })
                    }
                    placeholder="https://zoom.us/..."
                  />
                </div>
              </div>

              {/* Conflict Check Result */}
              {conflictCheck && (
                <div
                  className={`p-3 rounded-lg flex items-start gap-2 ${
                    conflictCheck.valid
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {conflictCheck.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      conflictCheck.valid ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {conflictCheck.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#FFB800] hover:bg-[#e6a600] text-black"
                  disabled={isLoading || !conflictCheck?.valid}
                >
                  {isLoading ? "Loading..." : "Jadwalkan Meeting"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terjadwal</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Video className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Live</p>
                <p className="text-2xl font-bold">{stats.live}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dibatalkan</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari meeting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="SCHEDULED">Terjadwal</SelectItem>
                <SelectItem value="LIVE">Live</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Tidak ada meeting
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {meeting.section.template.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Section {meeting.section.sectionLabel} •{" "}
                          {meeting.section.tutor.user.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(meeting.scheduledAt)}</TableCell>
                    <TableCell>{meeting.duration} menit</TableCell>
                    <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {meeting.meetingUrl &&
                          meeting.status === "SCHEDULED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(meeting.meetingUrl!, "_blank")
                              }
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          )}
                        {meeting.status === "SCHEDULED" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(meeting)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => setCancellingMeeting(meeting)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
          </DialogHeader>
          <MeetingForm onSubmit={handleEditMeeting} isEditing={true} />
        </DialogContent>
      </Dialog>

      {/* Cancel Meeting Confirmation Dialog */}
      <AlertDialog
        open={!!cancellingMeeting}
        onOpenChange={(open) => !open && setCancellingMeeting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan meeting{" "}
              <strong>"{cancellingMeeting?.title}"</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tidak</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMeeting}
              className="bg-red-500 hover:bg-red-600"
            >
              Batalkan Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
