import { NextResponse } from "next/server";

/**
 * Legacy Classes API - Deprecated
 * Class model has been removed, use sections/programs instead
 */

export async function GET() {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}
