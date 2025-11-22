import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ClassManagementClient } from "@/components/features/admin/ClassManagementClient";

async function getClasses() {
  const classes = await db.class.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tutor: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  // Convert dates to serializable format for client component
  return classes.map((cls) => ({
    ...cls,
    createdAt: cls.createdAt.toISOString(),
    updatedAt: cls.updatedAt.toISOString(),
  }));
}

async function getTutors() {
  const tutors = await db.tutorProfile.findMany({
    include: {
      user: true,
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return tutors.map((tutor) => ({
    id: tutor.id,
    name: tutor.user.name,
  }));
}

async function getClassStats() {
  const [totalClasses, activeClasses, totalEnrollments] = await Promise.all([
    db.class.count(),
    db.class.count({ where: { published: true } }),
    db.enrollment.count(),
  ]);

  const avgClassSize =
    totalClasses > 0 ? Math.round(totalEnrollments / totalClasses) : 0;

  return { totalClasses, activeClasses, totalEnrollments, avgClassSize };
}

export default async function AdminClasses() {
  const classes = await getClasses();
  const tutors = await getTutors();
  const stats = await getClassStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
        <p className="text-muted-foreground">
          Manage courses and monitor enrollments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Class Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgClassSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table with Client-side Features */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes ({classes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClassManagementClient classes={classes} tutors={tutors} />
        </CardContent>
      </Card>
    </div>
  );
}
