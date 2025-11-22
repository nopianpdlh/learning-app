"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Video,
  Download,
  BookmarkPlus,
  Bookmark,
  Play,
  Eye,
  Search,
  Filter,
  Clock,
  FileType,
} from "lucide-react";
import { toast } from "sonner";

// Mock data for materials
const mockMaterials = [
  {
    id: 1,
    title: "Pengenalan Python Programming",
    subject: "Pemrograman",
    type: "video",
    duration: "45 menit",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80",
    uploadDate: "2024-01-15",
    bookmarked: false,
    views: 234,
  },
  {
    id: 2,
    title: "Dasar-dasar Matematika Diskrit",
    subject: "Matematika",
    type: "pdf",
    duration: "15 halaman",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnail:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80",
    uploadDate: "2024-01-14",
    bookmarked: true,
    views: 189,
  },
  {
    id: 3,
    title: "Algoritma Sorting dan Searching",
    subject: "Pemrograman",
    type: "video",
    duration: "60 menit",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80",
    uploadDate: "2024-01-13",
    bookmarked: false,
    views: 312,
  },
  {
    id: 4,
    title: "Kalkulus Integral",
    subject: "Matematika",
    type: "pdf",
    duration: "20 halaman",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
    uploadDate: "2024-01-12",
    bookmarked: true,
    views: 267,
  },
  {
    id: 5,
    title: "Database Management Systems",
    subject: "Pemrograman",
    type: "video",
    duration: "55 menit",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&q=80",
    uploadDate: "2024-01-11",
    bookmarked: false,
    views: 198,
  },
  {
    id: 6,
    title: "Fisika Mekanika - Gerak Lurus",
    subject: "Fisika",
    type: "pdf",
    duration: "18 halaman",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnail:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
    uploadDate: "2024-01-10",
    bookmarked: false,
    views: 156,
  },
];

const Materials = () => {
  const [materials, setMaterials] = useState(mockMaterials);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<
    (typeof mockMaterials)[0] | null
  >(null);

  const toggleBookmark = (id: number) => {
    setMaterials(
      materials.map((mat) =>
        mat.id === id ? { ...mat, bookmarked: !mat.bookmarked } : mat
      )
    );
    const material = materials.find((m) => m.id === id);
    toast.success(
      material?.bookmarked
        ? "Bookmark dihapus"
        : "Materi ditambahkan ke bookmark"
    );
  };

  const handleDownload = (material: (typeof mockMaterials)[0]) => {
    toast.success(`Mengunduh ${material.title}...`);
    // In production, trigger actual download
    const link = document.createElement("a");
    link.href = material.url;
    link.download = material.title;
    link.click();
  };

  const handleView = (material: (typeof mockMaterials)[0]) => {
    setCurrentMaterial(material);
    setViewerOpen(true);
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" || material.subject === selectedSubject;
    const matchesType =
      selectedType === "all" || material.type === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const bookmarkedMaterials = filteredMaterials.filter((m) => m.bookmarked);
  const videoMaterials = filteredMaterials.filter((m) => m.type === "video");
  const pdfMaterials = filteredMaterials.filter((m) => m.type === "pdf");

  const subjects = Array.from(new Set(materials.map((m) => m.subject)));

  const MaterialCard = ({
    material,
  }: {
    material: (typeof mockMaterials)[0];
  }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-muted">
        <img
          src={material.thumbnail}
          alt={material.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge variant={material.type === "video" ? "default" : "secondary"}>
            {material.type === "video" ? (
              <Video className="h-3 w-3 mr-1" />
            ) : (
              <FileText className="h-3 w-3 mr-1" />
            )}
            {material.type.toUpperCase()}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full opacity-90 hover:opacity-100"
          onClick={() => handleView(material)}
        >
          {material.type === "video" ? (
            <Play className="h-6 w-6" />
          ) : (
            <Eye className="h-6 w-6" />
          )}
        </Button>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {material.title}
            </CardTitle>
            <div className="mt-2">
              <Badge variant="outline" className="mr-2">
                {material.subject}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleBookmark(material.id)}
          >
            {material.bookmarked ? (
              <Bookmark className="h-5 w-5 fill-primary text-primary" />
            ) : (
              <BookmarkPlus className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {material.duration}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {material.views}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(material)}
          >
            <Download className="h-4 w-4 mr-1" />
            Unduh
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Materi Pembelajaran
          </h1>
          <p className="text-muted-foreground mt-2">
            Akses semua materi pembelajaran dari kelas yang kamu ikuti
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari materi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <FileType className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipe Materi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="all">
              Semua ({filteredMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarked">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark ({bookmarkedMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-2" />
              Video ({videoMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="h-4 w-4 mr-2" />
              PDF ({pdfMaterials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookmarked" className="space-y-6">
            {bookmarkedMaterials.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada materi yang di-bookmark</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Material Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{currentMaterial?.title}</DialogTitle>
            <DialogDescription>
              <Badge variant="outline">{currentMaterial?.subject}</Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg">
            {currentMaterial?.type === "video" ? (
              <video
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
                src={currentMaterial.url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={currentMaterial?.url}
                className="w-full h-full border-0"
                title={currentMaterial?.title}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                currentMaterial && toggleBookmark(currentMaterial.id)
              }
            >
              {currentMaterial?.bookmarked ? (
                <>
                  <Bookmark className="h-4 w-4 mr-2 fill-primary text-primary" />
                  Hapus Bookmark
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Tambah Bookmark
                </>
              )}
            </Button>
            <Button
              onClick={() => currentMaterial && handleDownload(currentMaterial)}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Materi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Materials;
