import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy Classes API - Deprecated
 * Class model has been removed, use sections/programs instead
 */

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message:
      "Class model has been deprecated. Use /api/admin/sections or /api/admin/programs instead.",
    classes: [],
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}
