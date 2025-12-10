"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, Calendar, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Types
interface TutorAvailability {
  id: string;
  tutorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Tutor {
  id: string;
  user: {
    name: string;
    email: string;
  };
  availability: TutorAvailability[];
  _count?: {
    sections: number;
  };
}

interface TutorAvailabilityManagementClientProps {
  tutors: Tutor[];
}

const DAYS = [
  { value: 0, label: "Minggu", short: "Min" },
  { value: 1, label: "Senin", short: "Sen" },
  { value: 2, label: "Selasa", short: "Sel" },
  { value: 3, label: "Rabu", short: "Rab" },
  { value: 4, label: "Kamis", short: "Kam" },
  { value: 5, label: "Jumat", short: "Jum" },
  { value: 6, label: "Sabtu", short: "Sab" },
];

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export default function TutorAvailabilityManagementClient({
  tutors: initialTutors,
}: TutorAvailabilityManagementClientProps) {
  const [tutors, setTutors] = useState<Tutor[]>(initialTutors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  // Filter tutors
  const filteredTutors = tutors.filter(
    (t) =>
      t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalTutors: tutors.length,
    withAvailability: tutors.filter((t) => t.availability.length > 0).length,
    totalSlots: tutors.reduce((acc, t) => acc + t.availability.length, 0),
    activeSections: tutors.reduce(
      (acc, t) => acc + (t._count?.sections || 0),
      0
    ),
  };

  const resetForm = () => {
    setFormData({
      dayOfWeek: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutor) return;

    if (!formData.dayOfWeek || !formData.startTime || !formData.endTime) {
      toast.error("Lengkapi semua field");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error("Waktu mulai harus sebelum waktu selesai");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/tutor-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: selectedTutor.id,
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add slot");
      }

      const newSlot = await response.json();

      // Update tutors state
      setTutors(
        tutors.map((t) =>
          t.id === selectedTutor.id
            ? { ...t, availability: [...t.availability, newSlot] }
            : t
        )
      );

      // Update selected tutor
      setSelectedTutor({
        ...selectedTutor,
        availability: [...selectedTutor.availability, newSlot],
      });

      toast.success("Slot berhasil ditambahkan");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menambahkan slot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!selectedTutor) return;
    if (!confirm("Hapus slot ini?")) return;

    try {
      const response = await fetch(`/api/admin/tutor-availability/${slotId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete slot");

      // Update tutors state
      setTutors(
        tutors.map((t) =>
          t.id === selectedTutor.id
            ? {
                ...t,
                availability: t.availability.filter((a) => a.id !== slotId),
              }
            : t
        )
      );

      // Update selected tutor
      setSelectedTutor({
        ...selectedTutor,
        availability: selectedTutor.availability.filter((a) => a.id !== slotId),
      });

      toast.success("Slot berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus slot");
    }
  };

  const getAvailabilityForDay = (tutor: Tutor, dayOfWeek: number) => {
    return tutor.availability
      .filter((a) => a.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Weekly Grid Component
  const WeeklyGrid = ({ tutor }: { tutor: Tutor }) => (
    <div className="grid grid-cols-7 gap-2 mt-4">
      {DAYS.map((day) => (
        <div key={day.value} className="space-y-2">
          <div className="text-center font-medium text-sm py-2 bg-muted rounded">
            {day.short}
          </div>
          <div className="min-h-[100px] space-y-1">
            {getAvailabilityForDay(tutor, day.value).map((slot) => (
              <div
                key={slot.id}
                className={`p-2 rounded text-xs ${
                  slot.isActive
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                  </span>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2647]">
          Ketersediaan Tutor
        </h1>
        <p className="text-muted-foreground">
          Kelola jadwal ketersediaan tutor untuk kelas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0A2647]/10 rounded-lg">
                <Users className="h-5 w-5 text-[#0A2647]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tutor</p>
                <p className="text-2xl font-bold">{stats.totalTutors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Punya Jadwal</p>
                <p className="text-2xl font-bold">{stats.withAvailability}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Slot</p>
                <p className="text-2xl font-bold">{stats.totalSlots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sections</p>
                <p className="text-2xl font-bold">{stats.activeSections}</p>
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
              placeholder="Cari tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Tutor List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Tutor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredTutors.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Tidak ada tutor
                  </div>
                ) : (
                  filteredTutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedTutor?.id === tutor.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedTutor(tutor)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tutor.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tutor.user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {tutor.availability.length} slot
                          </Badge>
                          {tutor._count?.sections &&
                            tutor._count.sections > 0 && (
                              <Badge variant="secondary">
                                {tutor._count.sections} section
                              </Badge>
                            )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <div className="col-span-8">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {selectedTutor
                  ? `Jadwal: ${selectedTutor.user.name}`
                  : "Pilih Tutor"}
              </CardTitle>
              {selectedTutor && (
                <Button
                  size="sm"
                  className="bg-[#FFB800] hover:bg-[#e6a600] text-black"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Slot
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedTutor ? (
                <>
                  <WeeklyGrid tutor={selectedTutor} />
                  {selectedTutor.availability.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada jadwal. Klik "Tambah Slot" untuk menambahkan.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Pilih tutor dari daftar untuk melihat jadwal
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Slot Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Tambah Slot Ketersediaan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSlot} className="space-y-4">
            <div className="space-y-2">
              <Label>Hari *</Label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(value) =>
                  setFormData({ ...formData, dayOfWeek: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Waktu Mulai *</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) =>
                    setFormData({ ...formData, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mulai" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Waktu Selesai *</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) =>
                    setFormData({ ...formData, endTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selesai" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#FFB800] hover:bg-[#e6a600] text-black"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Tambah Slot"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
