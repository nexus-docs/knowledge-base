import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const issueSchema = z.object({
  pagePath: z.string().min(1),
  description: z.string().min(10),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
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
  const parsed = issueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pagePath, description, priority } = parsed.data;

  let issueUrl: string | null = null;
  let branchName: string | null = null;

  // Try GitLab integration
  if (process.env.GITLAB_TOKEN && process.env.GITLAB_CONTENT_PROJECT_ID) {
    try {
      const { createIssue, createBranch } = await import("@/lib/gitlab/client");

      const title = `[Docs] Issue on ${pagePath} (${priority})`;
      const issueBody = `**Reported by:** ${session.user.name || session.user.email}\n**Page:** ${pagePath}\n**Priority:** ${priority}\n\n${description}`;

      const result = await createIssue(title, issueBody, [
        "documentation",
        `priority::${priority}`,
      ]);

      issueUrl = result.issueUrl;

      const slug = pagePath.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-");
      branchName = await createBranch(
        `docs/issue-${result.issueId}-${slug}`,
        process.env.GITLAB_CONTENT_BRANCH || "main"
      );
    } catch (err) {
      console.error("GitLab integration failed:", err);
    }
  }

  await logAudit("issue.reported", session.user.id, {
    pagePath,
    description,
    priority,
    issueUrl,
    branchName,
  });

  return NextResponse.json(
    {
      message: "Issue reported successfully",
      pagePath,
      priority,
      issueUrl,
      branchName,
    },
    { status: 201 }
  );
}
