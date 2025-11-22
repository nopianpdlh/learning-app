import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  BookOpen,
} from "lucide-react";

const subjectGrades = [
  {
    subject: "Matematika",
    class: "Matematika XII",
    tutor: "Pak Budi Santoso",
    assignments: 88,
    quizzes: 92,
    midterm: 85,
    final: 0,
    overall: 88,
    progress: 88,
    trend: "up",
    status: "excellent",
  },
  {
    subject: "Fisika",
    class: "Fisika XII",
    tutor: "Bu Sarah Wijaya",
    assignments: 85,
    quizzes: 88,
    midterm: 82,
    final: 0,
    overall: 85,
    progress: 85,
    trend: "up",
    status: "good",
  },
  {
    subject: "Biologi",
    class: "Biologi XII",
    tutor: "Pak Ahmad Fauzi",
    assignments: 90,
    quizzes: 87,
    midterm: 88,
    final: 0,
    overall: 88,
    progress: 88,
    trend: "stable",
    status: "excellent",
  },
  {
    subject: "Bahasa Inggris",
    class: "Bahasa Inggris XII",
    tutor: "Ms. Linda Chen",
    assignments: 92,
    quizzes: 95,
    midterm: 90,
    final: 0,
    overall: 92,
    progress: 92,
    trend: "up",
    status: "excellent",
  },
  {
    subject: "Sejarah",
    class: "Sejarah XII",
    tutor: "Pak Dwi Nugroho",
    assignments: 78,
    quizzes: 80,
    midterm: 75,
    final: 0,
    overall: 78,
    progress: 78,
    trend: "down",
    status: "fair",
  },
  {
    subject: "Kimia",
    class: "Kimia XII",
    tutor: "Bu Siti Aminah",
    assignments: 82,
    quizzes: 85,
    midterm: 80,
    final: 0,
    overall: 82,
    progress: 82,
    trend: "up",
    status: "good",
  },
];

const recentScores = [
  {
    type: "Kuis",
    subject: "Bahasa Inggris",
    title: "Kuis Tenses",
    date: "2024-03-20",
    score: 92,
    maxScore: 100,
  },
  {
    type: "Tugas",
    subject: "Fisika",
    title: "Laporan Praktikum",
    date: "2024-03-18",
    score: 92,
    maxScore: 100,
  },
  {
    type: "Kuis",
    subject: "Matematika",
    title: "Kuis Mingguan",
    date: "2024-03-21",
    score: 88,
    maxScore: 100,
  },
  {
    type: "Tugas",
    subject: "Biologi",
    title: "Essay Fotosintesis",
    date: "2024-03-19",
    score: 90,
    maxScore: 100,
  },
];

export default function Grades() {
  const overallAverage = Math.round(
    subjectGrades.reduce((acc, g) => acc + g.overall, 0) / subjectGrades.length
  );

  const highestScore = Math.max(...subjectGrades.map((g) => g.overall));
  const lowestScore = Math.min(...subjectGrades.map((g) => g.overall));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "good":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "fair":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "poor":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Sangat Baik";
      case "good":
        return "Baik";
      case "fair":
        return "Cukup";
      case "poor":
        return "Perlu Perbaikan";
      default:
        return status;
    }
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapor & Nilai</h1>
          <p className="text-muted-foreground mt-1">
            Pantau perkembangan akademik Anda
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rata-rata Keseluruhan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {overallAverage}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari {subjectGrades.length} mata pelajaran
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nilai Tertinggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {highestScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {subjectGrades.find((g) => g.overall === highestScore)?.subject}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nilai Terendah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {lowestScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {subjectGrades.find((g) => g.overall === lowestScore)?.subject}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85</div>
              <p className="text-xs text-muted-foreground mt-1">
                Rata-rata minimal
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="detailed">
              Detail Per Mata Pelajaran
            </TabsTrigger>
            <TabsTrigger value="recent">Nilai Terbaru</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {subjectGrades.map((grade) => (
                <Card key={grade.subject}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {grade.subject}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {grade.tutor}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getStatusColor(grade.status)}
                            >
                              {getStatusLabel(grade.status)}
                            </Badge>
                            {grade.trend === "up" && (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                            {grade.trend === "down" && (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-semibold">
                              {grade.progress}%
                            </span>
                          </div>
                          <Progress value={grade.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 lg:flex-shrink-0">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {grade.overall}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Nilai Akhir
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Detailed Tab */}
          <TabsContent value="detailed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detail Nilai Per Mata Pelajaran</CardTitle>
                <CardDescription>
                  Breakdown nilai berdasarkan komponen penilaian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead className="text-center">Tugas</TableHead>
                      <TableHead className="text-center">Kuis</TableHead>
                      <TableHead className="text-center">UTS</TableHead>
                      <TableHead className="text-center">UAS</TableHead>
                      <TableHead className="text-center">Akhir</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectGrades.map((grade) => (
                      <TableRow key={grade.subject}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{grade.subject}</div>
                            <div className="text-xs text-muted-foreground">
                              {grade.tutor}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.assignments}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.quizzes}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.midterm}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.final || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            {grade.overall}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(grade.status)}
                          >
                            {getStatusLabel(grade.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Scores Tab */}
          <TabsContent value="recent" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nilai Terbaru</CardTitle>
                <CardDescription>
                  Nilai terbaru dari tugas dan kuis Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentScores.map((score, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            score.type === "Kuis"
                              ? "bg-blue-500/10 text-blue-700"
                              : "bg-green-500/10 text-green-700"
                          }`}
                        >
                          {score.type === "Kuis" ? (
                            <Target className="h-5 w-5" />
                          ) : (
                            <Award className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{score.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {score.subject} •{" "}
                            {new Date(score.date).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {score.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          dari {score.maxScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
