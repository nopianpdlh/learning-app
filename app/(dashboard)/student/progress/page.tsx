"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ProgressData {
  overview: {
    totalClasses: number;
    completedClasses: number;
    activeClasses: number;
  };
  assignments: {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    averageScore: number | null;
  };
  quizzes: {
    total: number;
    attempted: number;
    notAttempted: number;
    averageScore: number | null;
  };
  liveClasses: {
    total: number;
    upcoming: number;
    past: number;
  };
  classSummaries: Array<{
    classId: string;
    className: string;
    subject: string;
    gradeLevel: string;
    tutorName: string;
    enrollmentStatus: string;
    enrolledAt: string;
    assignments: {
      total: number;
      submitted: number;
      averageScore: number | null;
    };
    quizzes: {
      total: number;
      attempted: number;
      averageScore: number | null;
    };
  }>;
  recentActivity: Array<{
    type: "assignment" | "quiz";
    title: string;
    className: string;
    date: string;
    status?: string;
    score?: number | null;
  }>;
}

export default function StudentProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/student/progress");
      if (!response.ok) throw new Error("Failed to fetch progress");
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Failed to load progress data</p>
            <Button onClick={fetchProgress} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallCompletion =
    progress.overview.totalClasses > 0
      ? Math.round(
          (progress.overview.completedClasses /
            progress.overview.totalClasses) *
            100
        )
      : 0;

  const assignmentCompletion =
    progress.assignments.total > 0
      ? Math.round(
          (progress.assignments.submitted / progress.assignments.total) * 100
        )
      : 0;

  const quizCompletion =
    progress.quizzes.total > 0
      ? Math.round((progress.quizzes.attempted / progress.quizzes.total) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
        <p className="text-gray-600 mt-2">
          Track your learning progress across all your classes
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.overview.totalClasses}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progress.overview.activeClasses} active,{" "}
              {progress.overview.completedClasses} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.assignments.submitted}/{progress.assignments.total}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${assignmentCompletion}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {assignmentCompletion}% submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.quizzes.attempted}/{progress.quizzes.total}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${quizCompletion}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {quizCompletion}% attempted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.assignments.averageScore !== null
                ? `${progress.assignments.averageScore}%`
                : "N/A"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progress.quizzes.averageScore !== null &&
                `Quiz avg: ${progress.quizzes.averageScore}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Class Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Progress by Class</CardTitle>
        </CardHeader>
        <CardContent>
          {progress.classSummaries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No classes enrolled yet
            </p>
          ) : (
            <div className="space-y-4">
              {progress.classSummaries.map((classSummary) => (
                <div
                  key={classSummary.classId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {classSummary.className}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {classSummary.subject} • {classSummary.gradeLevel}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tutor: {classSummary.tutorName}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        classSummary.enrollmentStatus === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : classSummary.enrollmentStatus === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {classSummary.enrollmentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-orange-50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-orange-900">
                          Assignments
                        </span>
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-orange-900">
                        {classSummary.assignments.submitted}/
                        {classSummary.assignments.total}
                      </p>
                      {classSummary.assignments.averageScore !== null && (
                        <p className="text-xs text-orange-700 mt-1">
                          Avg: {classSummary.assignments.averageScore}%
                        </p>
                      )}
                    </div>

                    <div className="bg-green-50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-green-900">
                          Quizzes
                        </span>
                        <ClipboardCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {classSummary.quizzes.attempted}/
                        {classSummary.quizzes.total}
                      </p>
                      {classSummary.quizzes.averageScore !== null && (
                        <p className="text-xs text-green-700 mt-1">
                          Avg: {classSummary.quizzes.averageScore}%
                        </p>
                      )}
                    </div>

                    <div className="bg-purple-50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-900">
                          Overall
                        </span>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {classSummary.assignments.averageScore ||
                        classSummary.quizzes.averageScore
                          ? `${Math.round(
                              ((classSummary.assignments.averageScore || 0) +
                                (classSummary.quizzes.averageScore || 0)) /
                                2
                            )}%`
                          : "N/A"}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Combined avg
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {progress.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {progress.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        activity.type === "assignment"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {activity.type === "assignment" ? (
                        <FileText className="h-4 w-4" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600">
                        {activity.className}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.date).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.score !== null && activity.score !== undefined ? (
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="font-bold text-lg">
                          {activity.score}
                        </span>
                      </div>
                    ) : activity.status === "GRADED" ? (
                      <span className="text-sm text-gray-500">Graded</span>
                    ) : (
                      <span className="text-sm text-yellow-600">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
