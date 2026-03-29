import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, name, password } = parsed.data;

  // Find invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.acceptedAt) {
    return NextResponse.json(
      { error: "This invitation has already been used" },
      { status: 409 }
    );
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invitation has expired" },
      { status: 410 }
    );
  }

  // Check if user already exists (e.g. signed up via GitLab)
  let user = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  if (user) {
    // Update existing user
    const tierRank = { public: 0, client: 1, partner: 2, admin: 3 };
    const newTier =
      tierRank[invitation.tier] > tierRank[user.tier]
        ? invitation.tier
        : user.tier;

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        passwordHash,
        tier: newTier,
      },
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: invitation.email,
        name,
        passwordHash,
        tier: invitation.tier,
        emailVerified: new Date(),
      },
    });
  }

  // Grant extension permissions
  for (const ext of invitation.extensions) {
    await prisma.userPermission.upsert({
      where: {
        userId_extension: { userId: user.id, extension: ext },
      },
      update: {},
      create: {
        userId: user.id,
        extension: ext,
        grantedBy: invitation.invitedBy || "invitation",
      },
    });
  }

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  await logAudit("invitation.accepted", user.id, {
    invitationId: invitation.id,
    extensions: invitation.extensions,
  });

  return NextResponse.json({
    status: "accepted",
    message: "Account created. You can now sign in.",
    userId: user.id,
  });
}
