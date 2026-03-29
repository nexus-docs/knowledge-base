import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  slug: z.string().min(1).max(500),
  helpful: z.boolean(),
  comment: z.string().max(1000).optional().default(""),
});

/**
 * POST /api/feedback
 * Accepts page-level feedback (helpful yes/no + optional comment).
 *
 * For now, logs to stdout. In production, wire this to:
 * - A database table (prisma)
 * - An analytics service
 * - A Slack/email notification for negative feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feedback data" },
        { status: 400 }
      );
    }

    const { slug, helpful, comment } = parsed.data;

    // Log feedback (replace with DB insert in production)
    console.log(
      `[Feedback] slug=${slug} helpful=${helpful} comment="${comment}"`
    );

    // TODO: Store in database
    // await prisma.feedback.create({
    //   data: { slug, helpful, comment, createdAt: new Date() },
    // });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
