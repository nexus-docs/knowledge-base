import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const requestSchema = z.object({
  pagePath: z.string().min(1),
  tierRequested: z.enum(["client", "partner", "admin"]),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pagePath, tierRequested, message } = parsed.data;

  const existing = await prisma.accessRequest.findFirst({
    where: {
      requesterId: session.user.id,
      pagePath,
      status: "pending",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending request for this page" },
      { status: 409 }
    );
  }

  const accessRequest = await prisma.accessRequest.create({
    data: {
      requesterId: session.user.id,
      pagePath,
      tierRequested,
      message,
    },
  });

  await logAudit(
    "access.requested",
    session.user.id,
    { pagePath, tierRequested, requestId: accessRequest.id },
    request.headers.get("x-forwarded-for") || undefined
  );

  return NextResponse.json(accessRequest, { status: 201 });
}
