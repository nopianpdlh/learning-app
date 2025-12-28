"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Loader2,
  CalendarPlus,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface MeetingRequest {
  id: string;
  scheduledAt: string;
  duration: number;
  requestStatus: string;
  requestNote: string | null;
  rejectionNote: string | null;
  section: {
    template: { name: string };
  };
}

interface Enrollment {
  id: string;
  sectionId: string;
  meetingsRemaining: number;
  section: {
    sectionLabel: string;
    template: {
      name: string;
      classType: string;
    };
  };
}

interface MeetingRequestFormProps {
  enrollments: Enrollment[];
  onRequestCreated?: () => void;
}

export function MeetingRequestForm({
  enrollments,
  onRequestCreated,
}: MeetingRequestFormProps) {
  const [myRequests, setMyRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [note, setNote] = useState("");

  // Filter only PRIVATE classes with remaining meetings
  const privateEnrollments = enrollments.filter(
    (e) => e.section.template.classType === "PRIVATE" && e.meetingsRemaining > 0
  );

  const fetchMyRequests = async () => {
    try {
      const response = await fetch("/api/student/meeting-requests");
      const data = await response.json();
      if (response.ok) {
        setMyRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleSubmit = async () => {
    if (!selectedSection || !selectedDate || !selectedTime) {
      toast.error("Silakan lengkapi semua field");
      return;
    }

    // Combine date and time
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);

    // Validate time is at least 24 hours ahead
    const minTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (scheduledAt < minTime) {
      toast.error("Jadwal harus minimal 24 jam dari sekarang");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/student/meeting-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: selectedSection,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(duration),
          note,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Request jadwal berhasil dikirim! Tunggu approval admin."
        );
        setDialogOpen(false);
        resetForm();
        fetchMyRequests();
        onRequestCreated?.();
      } else {
        toast.error(data.error || "Gagal mengirim request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSection("");
    setSelectedDate("");
    setSelectedTime("");
    setDuration("60");
    setNote("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Menunggu Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Disetujui
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // If no private enrollments
  if (privateEnrollments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Request Jadwal Meeting</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Request Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Jadwal Meeting Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Select Section */}
              <div className="space-y-2">
                <Label>Pilih Kelas *</Label>
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas PRIVATE Anda" />
                  </SelectTrigger>
                  <SelectContent>
                    {privateEnrollments.map((e) => (
                      <SelectItem key={e.sectionId} value={e.sectionId}>
                        {e.section.template.name} - Section{" "}
                        {e.section.sectionLabel}
                        <span className="text-muted-foreground ml-2">
                          ({e.meetingsRemaining} meeting tersisa)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label>Waktu *</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Durasi</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 menit</SelectItem>
                    <SelectItem value="45">45 menit</SelectItem>
                    <SelectItem value="60">60 menit</SelectItem>
                    <SelectItem value="90">90 menit</SelectItem>
                    <SelectItem value="120">120 menit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Textarea
                  placeholder="Contoh: Mau fokus belajar materi X"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                * Jadwal harus minimal 24 jam dari sekarang. Maksimal 2 request
                pending.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Kirim Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : myRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Belum ada request jadwal. Klik tombol di atas untuk request.
          </p>
        ) : (
          <div className="space-y-3">
            {myRequests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{request.section.template.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(request.scheduledAt), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(request.scheduledAt), "HH:mm")} WIB
                    </span>
                  </div>
                  {request.requestStatus === "REJECTED" &&
                    request.rejectionNote && (
                      <p className="text-sm text-red-500">
                        Alasan: {request.rejectionNote}
                      </p>
                    )}
                </div>
                {getStatusBadge(request.requestStatus)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
