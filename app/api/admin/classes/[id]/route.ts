import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy Admin Classes API - Deprecated
 * Class model has been removed, use sections/programs instead
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: "Class model has been deprecated. Use sections/programs instead.",
    },
    { status: 410 }
  );
}
