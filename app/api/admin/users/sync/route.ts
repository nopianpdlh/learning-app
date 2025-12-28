import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SyncResult {
  orphanInSupabase: { id: string; email: string }[];
  orphanInPrisma: { id: string; email: string }[];
  synced: number;
  deleted: number;
}

// GET - Get sync status (preview what will be synced)
export async function GET(req: NextRequest) {
  try {
    // Verify admin role
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all users from Supabase Auth
    const { data: supabaseUsers, error: supabaseError } =
      await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      return NextResponse.json(
        { error: "Failed to fetch Supabase users" },
        { status: 500 }
      );
    }

    // Get all users from Prisma
    const prismaUsers = await db.user.findMany({
      select: { id: true, email: true },
    });

    // Find orphans
    const supabaseIds = new Set(supabaseUsers.users.map((u) => u.id));
    const prismaIds = new Set(prismaUsers.map((u) => u.id));

    // Users in Supabase but not in Prisma
    const orphanInSupabase = supabaseUsers.users
      .filter((u) => !prismaIds.has(u.id))
      .map((u) => ({ id: u.id, email: u.email || "No email" }));

    // Users in Prisma but not in Supabase
    const orphanInPrisma = prismaUsers
      .filter((u) => !supabaseIds.has(u.id))
      .map((u) => ({ id: u.id, email: u.email }));

    const result: SyncResult = {
      orphanInSupabase,
      orphanInPrisma,
      synced: prismaIds.size,
      deleted: 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync check error:", error);
    return NextResponse.json(
      { error: "Failed to check sync status" },
      { status: 500 }
    );
  }
}

// POST - Perform sync (delete orphan users)
export async function POST(req: NextRequest) {
  try {
    // Verify admin role
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, id: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body; // "delete_supabase_orphans" | "delete_prisma_orphans" | "delete_all"

    // Get all users from Supabase Auth
    const { data: supabaseUsers, error: supabaseError } =
      await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (supabaseError) {
      return NextResponse.json(
        { error: "Failed to fetch Supabase users" },
        { status: 500 }
      );
    }

    // Get all users from Prisma
    const prismaUsers = await db.user.findMany({
      select: { id: true, email: true },
    });

    const supabaseIds = new Set(supabaseUsers.users.map((u) => u.id));
    const prismaIds = new Set(prismaUsers.map((u) => u.id));

    let deletedFromSupabase = 0;
    let deletedFromPrisma = 0;

    // Delete orphans from Supabase Auth
    if (action === "delete_supabase_orphans" || action === "delete_all") {
      const orphansInSupabase = supabaseUsers.users.filter(
        (u) => !prismaIds.has(u.id)
      );

      for (const orphan of orphansInSupabase) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(orphan.id);
          deletedFromSupabase++;

          // Audit log
          await db.auditLog.create({
            data: {
              userId: dbUser.id,
              action: "SYNC_DELETE_SUPABASE",
              entity: "User",
              entityId: orphan.id,
              metadata: { email: orphan.email, source: "sync" },
            },
          });
        } catch (err) {
          console.error(`Failed to delete Supabase orphan ${orphan.id}:`, err);
        }
      }
    }

    // Delete orphans from Prisma
    if (action === "delete_prisma_orphans" || action === "delete_all") {
      const orphansInPrisma = prismaUsers.filter((u) => !supabaseIds.has(u.id));

      for (const orphan of orphansInPrisma) {
        try {
          // Delete related records first
          await db.auditLog.deleteMany({ where: { userId: orphan.id } });
          await db.studentProfile.deleteMany({ where: { userId: orphan.id } });
          await db.tutorProfile.deleteMany({ where: { userId: orphan.id } });

          await db.user.delete({ where: { id: orphan.id } });
          deletedFromPrisma++;

          // Audit log
          await db.auditLog.create({
            data: {
              userId: dbUser.id,
              action: "SYNC_DELETE_PRISMA",
              entity: "User",
              entityId: orphan.id,
              metadata: { email: orphan.email, source: "sync" },
            },
          });
        } catch (err) {
          console.error(`Failed to delete Prisma orphan ${orphan.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedFromSupabase,
      deletedFromPrisma,
      message: `Deleted ${deletedFromSupabase} from Supabase Auth, ${deletedFromPrisma} from Database`,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync users" },
      { status: 500 }
    );
  }
}
