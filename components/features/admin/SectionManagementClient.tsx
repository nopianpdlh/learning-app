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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Users,
  AlertTriangle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Types
interface Tutor {
  id: string;
  user: {
    name: string;
  };
}

interface ClassSection {
  id: string;
  templateId: string;
  sectionLabel: string;
  tutorId: string;
  status: "ACTIVE" | "FULL" | "ARCHIVED";
  currentEnrollments: number;
  createdAt: Date | string;
  tutor: Tutor;
  template?: {
    name: string;
    maxStudentsPerSection: number;
  };
  _count?: {
    enrollments: number;
  };
}

interface ClassTemplate {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  classType: "SEMI_PRIVATE" | "PRIVATE";
  maxStudentsPerSection: number;
  published: boolean;
  sections: ClassSection[];
  _count?: {
    sections: number;
    waitingList: number;
  };
}

interface SectionManagementClientProps {
  programs: ClassTemplate[];
  tutors: Tutor[];
}

export default function SectionManagementClient({
  programs: initialPrograms,
  tutors,
}: SectionManagementClientProps) {
  const [programs, setPrograms] = useState<ClassTemplate[]>(initialPrograms);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(
    new Set()
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ClassSection | null>(
    null
  );
  const [deletingSection, setDeletingSection] = useState<ClassSection | null>(
    null
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-suggestion state
  const [suggestionProgram, setSuggestionProgram] =
    useState<ClassTemplate | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const [formData, setFormData] = useState({
    sectionLabel: "",
    tutorId: "",
  });

  // Check for sections at 90% capacity
  useEffect(() => {
    // Don't show if user already dismissed
    if (suggestionDismissed) return;

    const programsNeedingSections = programs.filter((program) => {
      const latestSection = program.sections
        .filter((s) => s.status === "ACTIVE")
        .sort((a, b) => b.sectionLabel.localeCompare(a.sectionLabel))[0];

      if (latestSection) {
        const capacity =
          (latestSection.currentEnrollments / program.maxStudentsPerSection) *
          100;
        return capacity >= 90;
      }
      return program.sections.length === 0; // No sections = need first section
    });

    if (programsNeedingSections.length > 0 && !suggestionProgram) {
      setSuggestionProgram(programsNeedingSections[0]);
      setShowSuggestion(true);
    }
  }, [programs, suggestionProgram, suggestionDismissed]);

  // Filter programs by search
  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    totalSections: programs.reduce((acc, p) => acc + p.sections.length, 0),
    activeSections: programs.reduce(
      (acc, p) => acc + p.sections.filter((s) => s.status === "ACTIVE").length,
      0
    ),
    fullSections: programs.reduce(
      (acc, p) => acc + p.sections.filter((s) => s.status === "FULL").length,
      0
    ),
    totalEnrollments: programs.reduce(
      (acc, p) =>
        acc + p.sections.reduce((a, s) => a + s.currentEnrollments, 0),
      0
    ),
  };

  const toggleProgramExpand = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const getNextSectionLabel = (sections: ClassSection[]): string => {
    if (sections.length === 0) return "A";
    const labels = sections.map((s) => s.sectionLabel).sort();
    const lastLabel = labels[labels.length - 1];
    if (lastLabel === "Z") return "AA";
    return String.fromCharCode(lastLabel.charCodeAt(lastLabel.length - 1) + 1);
  };

  const resetForm = () => {
    setFormData({
      sectionLabel: "",
      tutorId: "",
    });
    setSelectedProgramId("");
  };

  const openAddDialog = (programId?: string) => {
    if (programId) {
      setSelectedProgramId(programId);
      const program = programs.find((p) => p.id === programId);
      if (program) {
        setFormData({
          sectionLabel: getNextSectionLabel(program.sections),
          tutorId: "",
        });
      }
    }
    setIsAddDialogOpen(true);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) {
      toast.error("Pilih program terlebih dahulu");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedProgramId,
          sectionLabel: formData.sectionLabel,
          tutorId: formData.tutorId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create section");
      }

      const newSection = await response.json();

      // Update programs state
      setPrograms(
        programs.map((p) =>
          p.id === selectedProgramId
            ? { ...p, sections: [...p.sections, newSection] }
            : p
        )
      );

      toast.success(`Section ${formData.sectionLabel} berhasil ditambahkan`);
      setIsAddDialogOpen(false);
      setShowSuggestion(false);
      setSuggestionProgram(null);
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menambahkan section");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/sections/${editingSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: formData.tutorId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update section");

      const updatedSection = await response.json();

      setPrograms(
        programs.map((p) => ({
          ...p,
          sections: p.sections.map((s) =>
            s.id === editingSection.id ? updatedSection : s
          ),
        }))
      );

      toast.success("Section berhasil diupdate");
      setIsEditDialogOpen(false);
      setEditingSection(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate section");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;

    if (deletingSection.currentEnrollments > 0) {
      toast.error("Tidak bisa menghapus section dengan enrollment aktif");
      setDeletingSection(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/sections/${deletingSection.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete section");

      setPrograms(
        programs.map((p) => ({
          ...p,
          sections: p.sections.filter((s) => s.id !== deletingSection.id),
        }))
      );

      toast.success("Section berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus section");
    } finally {
      setDeletingSection(null);
    }
  };

  const openEditDialog = (section: ClassSection) => {
    setEditingSection(section);
    setFormData({
      sectionLabel: section.sectionLabel,
      tutorId: section.tutorId,
    });
    setIsEditDialogOpen(true);
  };

  const getCapacityPercentage = (
    section: ClassSection,
    maxStudents: number
  ) => {
    return Math.round((section.currentEnrollments / maxStudents) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 90) return "bg-orange-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Form Component
  const SectionForm = ({
    onSubmit,
    isEditing,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    isEditing: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="program">Program *</Label>
          <Select
            value={selectedProgramId}
            onValueChange={(value) => {
              setSelectedProgramId(value);
              const program = programs.find((p) => p.id === value);
              if (program) {
                setFormData({
                  ...formData,
                  sectionLabel: getNextSectionLabel(program.sections),
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih program" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {programs
                .filter((p) => p.published)
                .map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} ({program.sections.length} sections)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="sectionLabel">Label Section *</Label>
        <Input
          id="sectionLabel"
          value={formData.sectionLabel}
          onChange={(e) =>
            setFormData({ ...formData, sectionLabel: e.target.value })
          }
          placeholder="A, B, C..."
          required
          disabled={!isEditing}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tutor">Tutor *</Label>
        <Select
          value={formData.tutorId}
          onValueChange={(value) =>
            setFormData({ ...formData, tutorId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih tutor" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {tutors.map((tutor) => (
              <SelectItem key={tutor.id} value={tutor.id}>
                {tutor.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || (!isEditing && !selectedProgramId)}
      >
        {isLoading
          ? "Loading..."
          : isEditing
          ? "Update Section"
          : "Tambah Section"}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Auto-Suggestion Alert */}
      {showSuggestion && suggestionProgram && (
        <AlertDialog open={showSuggestion} onOpenChange={setShowSuggestion}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Section Hampir Penuh
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{suggestionProgram.name}</strong> sudah mencapai 90%
                kapasitas.
                <br />
                Apakah Anda ingin membuat Section{" "}
                {getNextSectionLabel(suggestionProgram.sections)}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSuggestion(false);
                  setSuggestionProgram(null);
                  setSuggestionDismissed(true); // Prevent dialog from reappearing
                }}
              >
                Nanti
              </Button>
              <AlertDialogAction
                className="bg-[#FFB800] hover:bg-[#e6a600] text-black"
                onClick={() => {
                  setSelectedProgramId(suggestionProgram.id);
                  setFormData({
                    sectionLabel: getNextSectionLabel(
                      suggestionProgram.sections
                    ),
                    tutorId: "",
                  });
                  setShowSuggestion(false);
                  setIsAddDialogOpen(true);
                }}
              >
                Buat Section {getNextSectionLabel(suggestionProgram.sections)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2647]">
            Manajemen Section
          </h1>
          <p className="text-muted-foreground">
            Kelola section kelas per program
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#FFB800] hover:bg-[#e6a600] text-black"
              onClick={() => openAddDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Tambah Section Baru</DialogTitle>
            </DialogHeader>
            <SectionForm onSubmit={handleAddSection} isEditing={false} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0A2647]/10 rounded-lg">
                <Layers className="h-5 w-5 text-[#0A2647]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sections</p>
                <p className="text-2xl font-bold">{stats.totalSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.activeSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Layers className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full</p>
                <p className="text-2xl font-bold">{stats.fullSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Enrollments
                </p>
                <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
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
              placeholder="Cari program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Programs with Sections */}
      <div className="space-y-4">
        {filteredPrograms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchQuery
                ? "Tidak ada program yang cocok"
                : "Belum ada program"}
            </CardContent>
          </Card>
        ) : (
          filteredPrograms.map((program) => (
            <Card key={program.id}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleProgramExpand(program.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {expandedPrograms.has(program.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <BookOpen className="h-5 w-5 text-[#0A2647]" />
                    <div>
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {program.subject} • {program.gradeLevel} • Max{" "}
                        {program.maxStudentsPerSection} siswa/section
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <Badge variant="outline">
                      {program.sections.length} sections
                    </Badge>
                    <Badge
                      variant={
                        program.classType === "SEMI_PRIVATE"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {program.classType === "SEMI_PRIVATE"
                        ? "Semi-Private"
                        : "Private"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddDialog(program.id);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedPrograms.has(program.id) && (
                <CardContent>
                  {program.sections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada section.
                      <Button
                        variant="link"
                        className="text-[#FFB800]"
                        onClick={() => openAddDialog(program.id)}
                      >
                        Buat section pertama
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Section</TableHead>
                            <TableHead>Tutor</TableHead>
                            <TableHead>Kapasitas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {program.sections
                            .sort((a, b) =>
                              a.sectionLabel.localeCompare(b.sectionLabel)
                            )
                            .map((section) => {
                              const capacityPct = getCapacityPercentage(
                                section,
                                program.maxStudentsPerSection
                              );
                              return (
                                <TableRow key={section.id}>
                                  <TableCell>
                                    <span className="font-medium">
                                      Section {section.sectionLabel}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {section.tutor.user.name}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${getCapacityColor(
                                            capacityPct
                                          )}`}
                                          style={{
                                            width: `${Math.min(
                                              capacityPct,
                                              100
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-sm">
                                        {section.currentEnrollments}/
                                        {program.maxStudentsPerSection} (
                                        {capacityPct}%)
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        section.status === "ACTIVE"
                                          ? "default"
                                          : section.status === "FULL"
                                          ? "destructive"
                                          : "secondary"
                                      }
                                    >
                                      {section.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditDialog(section)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          setDeletingSection(section)
                                        }
                                        className="text-red-500 hover:text-red-700"
                                        disabled={
                                          section.currentEnrollments > 0
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              Edit Section {editingSection?.sectionLabel}
            </DialogTitle>
          </DialogHeader>
          <SectionForm onSubmit={handleEditSection} isEditing={true} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingSection}
        onOpenChange={(open) => !open && setDeletingSection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Section</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus{" "}
              <strong>Section {deletingSection?.sectionLabel}</strong>? Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
