import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.tier !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Use atomic updateMany with status check to prevent TOCTOU race condition
  const result = await prisma.accessRequest.updateMany({
    where: { id, status: "pending" },
    data: {
      status: "denied",
      reviewerId: session.user.id,
      reviewNote: body.note || null,
      reviewedAt: new Date(),
    },
  });

  if (result.count === 0) {
    // Either not found or already processed
    const exists = await prisma.accessRequest.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Request already processed" },
      { status: 409 }
    );
  }

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id },
  });

  await logAudit(
    "access.denied",
    session.user.id,
    { requestId: id, requesterId: accessRequest?.requesterId },
    request.headers.get("x-forwarded-for") || undefined
  );

  return NextResponse.json(accessRequest);
}
