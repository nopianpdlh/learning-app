/**
 * Student Grades API
 * GET /api/student/grades - Aggregate grades per enrolled section
 * Updated to use section-based system
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

    // Get enrolled sections with tutor info
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: {
        section: {
          include: {
            template: {
              select: {
                name: true,
                subject: true,
              },
            },
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

    const enrolledSectionIds = enrollments.map((e) => e.sectionId);

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
            sectionId: true,
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
            sectionId: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Aggregate grades per section
    const classGrades = enrollments.map((enrollment) => {
      const sectionId = enrollment.section.id;

      // Filter submissions for this section
      const sectionAssignments = assignmentSubmissions.filter(
        (s) => s.assignment.sectionId === sectionId
      );
      const sectionQuizzes = quizAttempts.filter(
        (a) => a.quiz.sectionId === sectionId
      );

      // Calculate averages
      const assignmentAvg =
        sectionAssignments.length > 0
          ? Math.round(
              sectionAssignments.reduce((sum, s) => {
                const normalized = (s.score! / s.assignment.maxPoints) * 100;
                return sum + normalized;
              }, 0) / sectionAssignments.length
            )
          : null;

      const quizAvg =
        sectionQuizzes.length > 0
          ? Math.round(
              sectionQuizzes.reduce((sum, a) => sum + (a.score || 0), 0) /
                sectionQuizzes.length
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
        classId: sectionId,
        className: `${enrollment.section.template.name} - Section ${enrollment.section.sectionLabel}`,
        subject: enrollment.section.template.subject,
        tutorName: enrollment.section.tutor.user.name,
        assignmentAvg,
        quizAvg,
        overallAvg,
        assignmentCount: sectionAssignments.length,
        quizCount: sectionQuizzes.length,
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
        (e) => e.section.id === s.assignment.sectionId
      );
      if (enrollment && s.gradedAt) {
        recentScores.push({
          type: "Tugas",
          subject: enrollment.section.template.subject,
          title: s.assignment.title,
          date: s.gradedAt.toISOString(),
          score: s.score!,
          maxScore: s.assignment.maxPoints,
        });
      }
    });

    // Add quiz scores
    quizAttempts.slice(0, 5).forEach((a) => {
      const enrollment = enrollments.find(
        (e) => e.section.id === a.quiz.sectionId
      );
      if (enrollment && a.submittedAt) {
        recentScores.push({
          type: "Kuis",
          subject: enrollment.section.template.subject,
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
