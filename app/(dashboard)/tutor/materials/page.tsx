"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Video,
  Link as LinkIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
} from "lucide-react";

const materials = [
  {
    id: 1,
    title: "Pengantar Kalkulus Integral",
    type: "pdf",
    class: "Matematika XII",
    size: "2.5 MB",
    downloads: 24,
    uploadDate: "2024-03-15",
  },
  {
    id: 2,
    title: "Video Pembelajaran - Turunan Fungsi",
    type: "video",
    class: "Matematika XII",
    duration: "45 menit",
    views: 156,
    uploadDate: "2024-03-14",
  },
  {
    id: 3,
    title: "Slide Presentasi Mekanika Kuantum",
    type: "pdf",
    class: "Fisika XII",
    size: "5.2 MB",
    downloads: 18,
    uploadDate: "2024-03-13",
  },
  {
    id: 4,
    title: "Link External - Khan Academy Trigonometry",
    type: "link",
    class: "Matematika XI",
    clicks: 42,
    uploadDate: "2024-03-12",
  },
  {
    id: 5,
    title: "Video Praktikum - Percobaan Dinamika",
    type: "video",
    class: "Fisika XI",
    duration: "30 menit",
    views: 89,
    uploadDate: "2024-03-11",
  },
];

export default function TutorMaterials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || material.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "link":
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      pdf: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      video: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      link: "bg-green-500/10 text-green-700 border-green-500/20",
    };
    return (
      <Badge variant="outline" className={variants[type]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Materi Pembelajaran
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola materi untuk kelas Anda
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Materi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Materi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PDF/Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {materials.filter((m) => m.type === "pdf").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {materials.filter((m) => m.type === "video").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {materials.filter((m) => m.type === "link").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filterType}
          onValueChange={setFilterType}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex gap-4 flex-1">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    {getTypeIcon(material.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {material.title}
                      </h3>
                      {getTypeBadge(material.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {material.class}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {material.size && <span>Size: {material.size}</span>}
                      {material.duration && (
                        <span>Duration: {material.duration}</span>
                      )}
                      {material.downloads !== undefined && (
                        <span>{material.downloads} downloads</span>
                      )}
                      {material.views !== undefined && (
                        <span>{material.views} views</span>
                      )}
                      {material.clicks !== undefined && (
                        <span>{material.clicks} clicks</span>
                      )}
                      <span>
                        Uploaded:{" "}
                        {new Date(material.uploadDate).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 lg:shrink-0">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
