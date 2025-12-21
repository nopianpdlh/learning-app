"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
} from "lucide-react";

// Types
interface WaitingListEntry {
  id: string;
  studentId: string;
  templateId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  requestedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionNote: string | null;
  assignedSectionId: string | null;
  student: {
    id: string;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
  template: {
    id: string;
    name: string;
    subject: string;
    classType: "SEMI_PRIVATE" | "PRIVATE";
    maxStudentsPerSection: number;
    pricePerMonth: number;
    sections: {
      id: string;
      sectionLabel: string;
      currentEnrollments: number;
      status: "ACTIVE" | "FULL" | "ARCHIVED";
    }[];
  };
}

interface WaitingListManagementClientProps {
  waitingList: WaitingListEntry[];
}

export default function WaitingListManagementClient({
  waitingList: initialWaitingList,
}: WaitingListManagementClientProps) {
  const [waitingList, setWaitingList] =
    useState<WaitingListEntry[]>(initialWaitingList);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(
    null
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter waiting list
  const filteredList = waitingList.filter((entry) => {
    const matchesSearch =
      entry.student.user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      entry.template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.student.user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = entry.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    pending: waitingList.filter((e) => e.status === "PENDING").length,
    approved: waitingList.filter((e) => e.status === "APPROVED").length,
    rejected: waitingList.filter((e) => e.status === "REJECTED").length,
    expired: waitingList.filter((e) => e.status === "EXPIRED").length,
  };

  const openApproveDialog = (entry: WaitingListEntry) => {
    setSelectedEntry(entry);
    setSelectedSectionId("");
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (entry: WaitingListEntry) => {
    setSelectedEntry(entry);
    setRejectionNote("");
    setIsRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedEntry || !selectedSectionId) {
      toast.error("Pilih section terlebih dahulu");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/waiting-list/${selectedEntry.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: selectedSectionId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }

      const updatedEntry = await response.json();

      setWaitingList(
        waitingList.map((e) => (e.id === selectedEntry.id ? updatedEntry : e))
      );

      toast.success(`${selectedEntry.student.user.name} berhasil di-approve`);
      setIsApproveDialogOpen(false);
      setSelectedEntry(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal approve");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/waiting-list/${selectedEntry.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectionNote: rejectionNote,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reject");

      const updatedEntry = await response.json();

      setWaitingList(
        waitingList.map((e) => (e.id === selectedEntry.id ? updatedEntry : e))
      );

      toast.success(`Request dari ${selectedEntry.student.user.name} ditolak`);
      setIsRejectDialogOpen(false);
      setSelectedEntry(null);
      setRejectionNote("");
    } catch (error) {
      console.error(error);
      toast.error("Gagal reject");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAvailableSections = (entry: WaitingListEntry) => {
    return entry.template.sections.filter(
      (s) =>
        s.status === "ACTIVE" &&
        s.currentEnrollments < entry.template.maxStudentsPerSection
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2647]">Waiting List</h1>
        <p className="text-muted-foreground">
          Kelola permintaan pendaftaran siswa
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
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
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa, program, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs & Table */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="PENDING"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFB800] data-[state=active]:bg-transparent"
              >
                <Clock className="h-4 w-4 mr-2" />
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger
                value="APPROVED"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger
                value="REJECTED"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejected ({stats.rejected})
              </TabsTrigger>
              <TabsTrigger
                value="EXPIRED"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-500 data-[state=active]:bg-transparent"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Expired ({stats.expired})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Tanggal Request</TableHead>
                    <TableHead>Sections Available</TableHead>
                    {activeTab !== "PENDING" && (
                      <TableHead>Status Info</TableHead>
                    )}
                    {activeTab === "PENDING" && (
                      <TableHead className="text-right">Aksi</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredList.map((entry) => {
                      const availableSections = getAvailableSections(entry);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {entry.student.user.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {entry.student.user.email}
                              </p>
                              {entry.student.user.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {entry.student.user.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-[#0A2647]" />
                              <div>
                                <p className="font-medium">
                                  {entry.template.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatPrice(entry.template.pricePerMonth)}
                                  /bulan
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(entry.requestedAt)}</TableCell>
                          <TableCell>
                            {availableSections.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {availableSections.map((s) => (
                                  <Badge
                                    key={s.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {s.sectionLabel} ({s.currentEnrollments}/
                                    {entry.template.maxStudentsPerSection})
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="destructive">
                                Semua section penuh
                              </Badge>
                            )}
                          </TableCell>
                          {activeTab === "APPROVED" && (
                            <TableCell>
                              <p className="text-sm">
                                Approved:{" "}
                                {entry.approvedAt &&
                                  formatDate(entry.approvedAt)}
                              </p>
                            </TableCell>
                          )}
                          {activeTab === "REJECTED" && (
                            <TableCell>
                              <p className="text-sm text-red-600">
                                {entry.rejectionNote || "Tidak ada catatan"}
                              </p>
                            </TableCell>
                          )}
                          {activeTab === "EXPIRED" && (
                            <TableCell>
                              <p className="text-sm text-muted-foreground">
                                Payment timeout
                              </p>
                            </TableCell>
                          )}
                          {activeTab === "PENDING" && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => openApproveDialog(entry)}
                                  disabled={availableSections.length === 0}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openRejectDialog(entry)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p>
                  <strong>Siswa:</strong> {selectedEntry.student.user.name}
                </p>
                <p>
                  <strong>Program:</strong> {selectedEntry.template.name}
                </p>
                <p>
                  <strong>Harga:</strong>{" "}
                  {formatPrice(selectedEntry.template.pricePerMonth)}/bulan
                </p>
              </div>

              <div className="space-y-2">
                <Label>Pilih Section *</Label>
                <Select
                  value={selectedSectionId}
                  onValueChange={setSelectedSectionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih section" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {getAvailableSections(selectedEntry).map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        Section {section.sectionLabel} (
                        {section.currentEnrollments}/
                        {selectedEntry.template.maxStudentsPerSection} siswa)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsApproveDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={isLoading || !selectedSectionId}
                >
                  {isLoading ? "Loading..." : "Approve & Kirim Invoice"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p>
                  <strong>Siswa:</strong> {selectedEntry.student.user.name}
                </p>
                <p>
                  <strong>Program:</strong> {selectedEntry.template.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Alasan Penolakan (opsional)</Label>
                <Textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Berikan alasan penolakan..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsRejectDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Tolak Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
