"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Loader2,
  Check,
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface MeetingRequest {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  requestStatus: string;
  requestNote: string | null;
  rejectionNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  section: {
    sectionLabel: string;
    template: { name: string; classType: string };
    tutor: { user: { name: string; email: string } };
  };
  student: { name: string; email: string; phone: string | null } | null;
  availabilityCheck?: {
    isWithinAvailability: boolean;
    hasConflict: boolean;
    tutorAvailability: { startTime: string; endTime: string }[];
  };
}

export default function MeetingRequestsPage() {
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(
    null
  );
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/meeting-requests?status=${statusFilter}`
      );
      const data = await response.json();
      if (response.ok) {
        setRequests(data);
      } else {
        toast.error(data.error || "Gagal memuat data");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/meeting-requests/${selectedRequest.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingUrl }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Request berhasil disetujui!");
        setApproveDialogOpen(false);
        setMeetingUrl("");
        fetchRequests();
      } else {
        toast.error(data.error || "Gagal menyetujui request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/meeting-requests/${selectedRequest.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Request berhasil ditolak");
        setRejectDialogOpen(false);
        setRejectionReason("");
        fetchRequests();
      } else {
        toast.error(data.error || "Gagal menolak request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Menunggu Review</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500">Disetujui</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Jadwal Meeting</h1>
          <p className="text-muted-foreground">
            Review dan kelola permintaan jadwal dari siswa kelas PRIVATE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="PENDING">Menunggu Review</SelectItem>
              <SelectItem value="APPROVED">Disetujui</SelectItem>
              <SelectItem value="REJECTED">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Tidak ada request dengan status ini
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Jadwal Diminta</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Ketersediaan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {request.student?.name || "-"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.student?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {request.section.template.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Section {request.section.sectionLabel} •{" "}
                            {request.section.tutor.user.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p>
                            {format(
                              new Date(request.scheduledAt),
                              "EEEE, dd MMM yyyy",
                              { locale: localeId }
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.scheduledAt), "HH:mm")} WIB
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {request.duration} menit
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.availabilityCheck ? (
                        <div className="space-y-1">
                          {request.availabilityCheck.isWithinAvailability ? (
                            <Badge className="bg-green-500 flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              Tutor Available
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1 w-fit"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Di Luar Jadwal
                            </Badge>
                          )}
                          {request.availabilityCheck.hasConflict && (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1 w-fit"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Bentrok
                            </Badge>
                          )}
                          {request.availabilityCheck.tutorAvailability.length >
                            0 && (
                            <p className="text-xs text-muted-foreground">
                              Slot:{" "}
                              {request.availabilityCheck.tutorAvailability
                                .map((s) => `${s.startTime}-${s.endTime}`)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.requestStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.requestStatus === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      )}
                      {request.requestStatus === "REJECTED" &&
                        request.rejectionNote && (
                          <p className="text-sm text-red-500 text-left">
                            Alasan: {request.rejectionNote}
                          </p>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Request Jadwal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting URL (Opsional)</Label>
              <Input
                placeholder="https://meet.google.com/xxx atau Zoom link"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Link meeting dapat ditambahkan nanti jika belum ada
              </p>
            </div>
            {selectedRequest && (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
                <p>
                  <strong>Siswa:</strong> {selectedRequest.student?.name}
                </p>
                <p>
                  <strong>Program:</strong>{" "}
                  {selectedRequest.section.template.name}
                </p>
                <p>
                  <strong>Jadwal:</strong>{" "}
                  {format(
                    new Date(selectedRequest.scheduledAt),
                    "EEEE, dd MMM yyyy HH:mm",
                    { locale: localeId }
                  )}
                </p>
                <p>
                  <strong>Durasi:</strong> {selectedRequest.duration} menit
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Setujui Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Request Jadwal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alasan Penolakan *</Label>
              <Textarea
                placeholder="Jelaskan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
            {selectedRequest && (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
                <p>
                  <strong>Siswa:</strong> {selectedRequest.student?.name}
                </p>
                <p>
                  <strong>Program:</strong>{" "}
                  {selectedRequest.section.template.name}
                </p>
                <p>
                  <strong>Jadwal:</strong>{" "}
                  {format(
                    new Date(selectedRequest.scheduledAt),
                    "EEEE, dd MMM yyyy HH:mm",
                    { locale: localeId }
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tolak Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
