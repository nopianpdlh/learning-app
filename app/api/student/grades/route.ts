/**
 * Student Grades API
 * GET /api/student/grades - Aggregate grades per enrolled class
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get enrolled classes with tutor info
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: { in: ["ACTIVE", "PAID"] },
      },
      include: {
        class: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        classGrades: [],
        recentScores: [],
        stats: {
          overallAverage: 0,
          highestScore: 0,
          lowestScore: 0,
          highestSubject: "",
          lowestSubject: "",
          totalClasses: 0,
        },
      });
    }

    // Get all graded assignment submissions
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: studentProfile.id,
        status: "GRADED",
        score: { not: null },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            classId: true,
            maxPoints: true,
          },
        },
      },
      orderBy: { gradedAt: "desc" },
    });

    // Get all completed quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId: studentProfile.id,
        submittedAt: { not: null },
        score: { not: null },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            classId: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Aggregate grades per class
    const classGrades = enrollments.map((enrollment) => {
      const classId = enrollment.class.id;

      // Filter submissions for this class
      const classAssignments = assignmentSubmissions.filter(
        (s) => s.assignment.classId === classId
      );
      const classQuizzes = quizAttempts.filter(
        (a) => a.quiz.classId === classId
      );

      // Calculate averages
      const assignmentAvg =
        classAssignments.length > 0
          ? Math.round(
              classAssignments.reduce((sum, s) => {
                // Normalize to 100 scale
                const normalized = (s.score! / s.assignment.maxPoints) * 100;
                return sum + normalized;
              }, 0) / classAssignments.length
            )
          : null;

      const quizAvg =
        classQuizzes.length > 0
          ? Math.round(
              classQuizzes.reduce((sum, a) => sum + (a.score || 0), 0) /
                classQuizzes.length
            )
          : null;

      // Calculate overall average
      const scores = [assignmentAvg, quizAvg].filter(
        (s) => s !== null
      ) as number[];
      const overallAvg =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      // Determine status
      let status = "none";
      if (overallAvg !== null) {
        if (overallAvg >= 85) status = "excellent";
        else if (overallAvg >= 70) status = "good";
        else if (overallAvg >= 55) status = "fair";
        else status = "poor";
      }

      return {
        classId,
        className: enrollment.class.name,
        subject: enrollment.class.subject,
        tutorName: enrollment.class.tutor.user.name,
        assignmentAvg,
        quizAvg,
        overallAvg,
        assignmentCount: classAssignments.length,
        quizCount: classQuizzes.length,
        status,
      };
    });

    // Build recent scores (last 10)
    const recentScores: Array<{
      type: string;
      subject: string;
      title: string;
      date: string;
      score: number;
      maxScore: number;
    }> = [];

    // Add assignment scores
    assignmentSubmissions.slice(0, 5).forEach((s) => {
      const enrollment = enrollments.find(
        (e) => e.class.id === s.assignment.classId
      );
      if (enrollment && s.gradedAt) {
        recentScores.push({
          type: "Tugas",
          subject: enrollment.class.subject,
          title: s.assignment.title,
          date: s.gradedAt.toISOString(),
          score: s.score!,
          maxScore: s.assignment.maxPoints,
        });
      }
    });

    // Add quiz scores
    quizAttempts.slice(0, 5).forEach((a) => {
      const enrollment = enrollments.find((e) => e.class.id === a.quiz.classId);
      if (enrollment && a.submittedAt) {
        recentScores.push({
          type: "Kuis",
          subject: enrollment.class.subject,
          title: a.quiz.title,
          date: a.submittedAt.toISOString(),
          score: a.score!,
          maxScore: 100,
        });
      }
    });

    // Sort by date descending and take latest 10
    recentScores.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestScores = recentScores.slice(0, 10);

    // Calculate overall stats
    const classesWithGrades = classGrades.filter((c) => c.overallAvg !== null);
    const allOveralls = classesWithGrades.map((c) => c.overallAvg as number);

    const stats = {
      overallAverage:
        allOveralls.length > 0
          ? Math.round(
              allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length
            )
          : 0,
      highestScore: allOveralls.length > 0 ? Math.max(...allOveralls) : 0,
      lowestScore: allOveralls.length > 0 ? Math.min(...allOveralls) : 0,
      highestSubject:
        classesWithGrades.find((c) => c.overallAvg === Math.max(...allOveralls))
          ?.subject || "",
      lowestSubject:
        classesWithGrades.find((c) => c.overallAvg === Math.min(...allOveralls))
          ?.subject || "",
      totalClasses: classGrades.length,
    };

    return NextResponse.json({
      classGrades,
      recentScores: latestScores,
      stats,
    });
  } catch (error) {
    console.error("GET /api/student/grades error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}
