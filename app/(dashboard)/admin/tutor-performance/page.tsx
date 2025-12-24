import { prisma } from "@/lib/db";
import TutorPerformanceClient from "@/components/features/admin/TutorPerformanceClient";

interface TutorPerformanceData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  education: string | null;
  experience: number | null;
  sections: {
    total: number;
    active: number;
  };
  materials: number;
  assignments: number;
  quizzes: number;
  meetings: {
    total: number;
    completed: number;
    cancelled: number;
  };
  students: {
    total: number;
    active: number;
  };
  submissionRate: number;
  passRate: number;
}

async function getTutorPerformanceData(): Promise<TutorPerformanceData[]> {
  const tutors = await prisma.tutorProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      sections: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
          },
          materials: true,
          assignments: {
            include: {
              submissions: true,
            },
          },
          quizzes: {
            include: {
              attempts: true,
              questions: true,
            },
          },
          meetings: true,
        },
      },
    },
  });

  return tutors.map((tutor) => {
    // Calculate sections
    const totalSections = tutor.sections.length;
    const activeSections = tutor.sections.filter(
      (s) => s.status === "ACTIVE"
    ).length;

    // Calculate materials
    const totalMaterials = tutor.sections.reduce(
      (sum, section) => sum + section.materials.length,
      0
    );

    // Calculate assignments
    const totalAssignments = tutor.sections.reduce(
      (sum, section) => sum + section.assignments.length,
      0
    );

    // Calculate quizzes
    const totalQuizzes = tutor.sections.reduce(
      (sum, section) => sum + section.quizzes.length,
      0
    );

    // Calculate meetings - count past meetings as completed even if status is still SCHEDULED
    const allMeetings = tutor.sections.flatMap((s) => s.meetings);
    const now = new Date();
    const completedMeetings = allMeetings.filter(
      (m) =>
        m.status === "COMPLETED" ||
        (m.status === "SCHEDULED" && new Date(m.scheduledAt) < now)
    ).length;
    const cancelledMeetings = allMeetings.filter(
      (m) => m.status === "CANCELLED"
    ).length;

    // Calculate students
    const totalStudents = tutor.sections.reduce(
      (sum, section) => sum + section.enrollments.length,
      0
    );

    // Calculate submission rate
    const allAssignments = tutor.sections.flatMap((s) => s.assignments);
    const totalSubmissions = allAssignments.reduce(
      (sum, a) => sum + a.submissions.length,
      0
    );
    const expectedSubmissions = allAssignments.reduce((sum, a) => {
      const section = tutor.sections.find((s) => s.id === a.sectionId);
      return sum + (section?.enrollments.length || 0);
    }, 0);
    const submissionRate =
      expectedSubmissions > 0
        ? Math.round((totalSubmissions / expectedSubmissions) * 100)
        : 0;

    // Calculate quiz pass rate
    const allQuizzes = tutor.sections.flatMap((s) => s.quizzes);
    const allAttempts = allQuizzes.flatMap((q) => q.attempts);
    const passedAttempts = allAttempts.filter((attempt) => {
      const quiz = allQuizzes.find((q) => q.id === attempt.quizId);
      return (
        attempt.score !== null &&
        quiz &&
        attempt.score >= (quiz.passingGrade || 0)
      );
    }).length;
    const passRate =
      allAttempts.length > 0
        ? Math.round((passedAttempts / allAttempts.length) * 100)
        : 0;

    return {
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
      avatar: tutor.user.avatar,
      bio: tutor.bio,
      education: tutor.education,
      experience: tutor.experience,
      sections: {
        total: totalSections,
        active: activeSections,
      },
      materials: totalMaterials,
      assignments: totalAssignments,
      quizzes: totalQuizzes,
      meetings: {
        total: allMeetings.length,
        completed: completedMeetings,
        cancelled: cancelledMeetings,
      },
      students: {
        total: totalStudents,
        active: totalStudents, // Active enrollments already filtered
      },
      submissionRate,
      passRate,
    };
  });
}

async function getSummaryStats() {
  const [totalTutors, activeSections, totalMeetings, completedMeetings] =
    await Promise.all([
      prisma.tutorProfile.count(),
      prisma.classSection.count({ where: { status: "ACTIVE" } }),
      prisma.scheduledMeeting.count(),
      prisma.scheduledMeeting.count({ where: { status: "COMPLETED" } }),
    ]);

  const meetingCompletionRate =
    totalMeetings > 0
      ? Math.round((completedMeetings / totalMeetings) * 100)
      : 0;

  return {
    totalTutors,
    activeSections,
    meetingCompletionRate,
  };
}

export default async function TutorPerformancePage() {
  const [tutorData, summaryStats] = await Promise.all([
    getTutorPerformanceData(),
    getSummaryStats(),
  ]);

  return <TutorPerformanceClient tutors={tutorData} summary={summaryStats} />;
}
