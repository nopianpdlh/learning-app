"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  FileText,
  ClipboardList,
  HelpCircle,
  Video,
  ChevronLeft,
  Clock,
  Calendar,
  User,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
} from "lucide-react";

interface Props {
  section: {
    id: string;
    label: string;
    status: string;
    template: {
      id: string;
      name: string;
      description: string;
      subject: string;
      gradeLevel: string;
      thumbnail: string | null;
    };
    tutor: {
      id: string;
      name: string;
      avatar: string | null;
      email: string;
    };
  };
  enrollment: {
    id: string;
    status: string;
    startDate: string | null;
    expiryDate: string | null;
    daysRemaining: number;
    meetingsRemaining: number;
    totalMeetings: number;
  };
  materials: {
    id: string;
    title: string;
    description: string | null;
    session: number;
    fileType: string;
    fileUrl: string | null;
    videoUrl: string | null;
    thumbnail: string | null;
  }[];
  assignments: {
    id: string;
    title: string;
    dueDate: string;
    maxPoints: number;
    status: string;
    submission: { id: string; status: string; score: number | null } | null;
  }[];
  quizzes: {
    id: string;
    title: string;
    questionsCount: number;
    timeLimit: number | null;
    passingGrade: number | null;
    lastAttempt: {
      id: string;
      score: number | null;
      submittedAt: string | null;
    } | null;
  }[];
  meetings: {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number;
    meetingUrl: string | null;
    status: string;
  }[];
}

export default function StudentSectionDetailClient({
  section,
  enrollment,
  materials,
  assignments,
  quizzes,
  meetings,
}: Props) {
  const [activeTab, setActiveTab] = useState("materials");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPastDue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getSubmissionBadge = (
    submission: Props["assignments"][0]["submission"]
  ) => {
    if (!submission) return <Badge variant="outline">Belum Dikerjakan</Badge>;
    if (submission.status === "GRADED") {
      return (
        <Badge variant="default" className="bg-green-600">
          Nilai: {submission.score}
        </Badge>
      );
    }
    return <Badge variant="secondary">Dikumpulkan</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/student/sections"
          className="hover:text-primary flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kelas Saya
        </Link>
        <span>/</span>
        <span>
          {section.template.name} - Section {section.label}
        </span>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {section.template.thumbnail && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <Image
                  src={section.template.thumbnail}
                  alt={section.template.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-[#0A2647]">
                  {section.template.name}
                </h1>
                <p className="text-muted-foreground">
                  Section {section.label} • {section.template.subject} •{" "}
                  {section.template.gradeLevel}
                </p>
              </div>

              {/* Tutor */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{section.tutor.name}</span>
              </div>

              {/* Subscription Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Berakhir:{" "}
                    {enrollment.expiryDate && formatDate(enrollment.expiryDate)}
                  </span>
                </div>
                {enrollment.status === "ACTIVE" && (
                  <Badge
                    variant={
                      enrollment.daysRemaining <= 3 ? "destructive" : "default"
                    }
                  >
                    {enrollment.daysRemaining} hari tersisa
                  </Badge>
                )}
                {enrollment.status === "EXPIRED" && (
                  <Badge variant="destructive">Expired</Badge>
                )}
              </div>

              {/* Progress */}
              {enrollment.totalMeetings > 0 && (
                <div className="space-y-1 max-w-xs">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pertemuan</span>
                    <span>
                      {enrollment.totalMeetings - enrollment.meetingsRemaining}/
                      {enrollment.totalMeetings}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((enrollment.totalMeetings -
                        enrollment.meetingsRemaining) /
                        enrollment.totalMeetings) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="materials" className="gap-2">
            <FileText className="h-4 w-4" />
            Materi ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tugas ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Quiz ({quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2">
            <Video className="h-4 w-4" />
            Jadwal ({meetings.length})
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4 mt-4">
          {materials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Belum ada materi
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        {material.fileType === "VIDEO" ? (
                          <Play className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Pertemuan {material.session}
                        </p>
                        <h3 className="font-medium">{material.title}</h3>
                        {material.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {material.description}
                          </p>
                        )}
                        <div className="flex gap-2 pt-2">
                          {material.fileUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={material.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          )}
                          {material.videoUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={material.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Tonton
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4 mt-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Belum ada tugas
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{assignment.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(assignment.dueDate)}
                          </span>
                          <span>Maks: {assignment.maxPoints} poin</span>
                          {isPastDue(assignment.dueDate) &&
                            !assignment.submission && (
                              <Badge variant="destructive">Terlambat</Badge>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getSubmissionBadge(assignment.submission)}
                        <Button size="sm" asChild>
                          <Link
                            href={`/student/sections/${section.id}/assignments/${assignment.id}`}
                          >
                            {assignment.submission ? "Lihat" : "Kerjakan"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4 mt-4">
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Belum ada quiz
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{quiz.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{quiz.questionsCount} soal</span>
                          {quiz.timeLimit && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {quiz.timeLimit} menit
                            </span>
                          )}
                          {quiz.passingGrade && (
                            <span>Passing: {quiz.passingGrade}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {quiz.lastAttempt ? (
                          <Badge
                            variant={
                              quiz.lastAttempt.score &&
                              quiz.lastAttempt.score >= (quiz.passingGrade || 0)
                                ? "default"
                                : "secondary"
                            }
                          >
                            Nilai: {quiz.lastAttempt.score || 0}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Belum Dikerjakan</Badge>
                        )}
                        <Button size="sm" asChild>
                          <Link
                            href={`/student/sections/${section.id}/quizzes/${quiz.id}`}
                          >
                            {quiz.lastAttempt ? "Lihat Hasil" : "Mulai"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4 mt-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Belum ada jadwal pertemuan
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => {
                const meetingDate = new Date(meeting.scheduledAt);
                const now = new Date();
                const isLive =
                  meeting.status === "LIVE" ||
                  (meetingDate <= now &&
                    now <=
                      new Date(
                        meetingDate.getTime() + meeting.duration * 60000
                      ));
                const isPast =
                  meeting.status === "COMPLETED" || meetingDate < now;

                return (
                  <Card key={meeting.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{meeting.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDateTime(meeting.scheduledAt)}
                            </span>
                            <span>{meeting.duration} menit</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isLive && (
                            <Badge
                              variant="destructive"
                              className="animate-pulse"
                            >
                              LIVE
                            </Badge>
                          )}
                          {isPast && !isLive && (
                            <Badge variant="secondary">Selesai</Badge>
                          )}
                          {meeting.meetingUrl && !isPast && (
                            <Button
                              size="sm"
                              asChild
                              disabled={!isLive && meetingDate > now}
                            >
                              <a
                                href={meeting.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
