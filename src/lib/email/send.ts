import { enqueueEmail } from "@/lib/queue/producers";

export async function sendEmail(
  to: string,
  template: string,
  data: Record<string, unknown>
): Promise<void> {
  await enqueueEmail(to, template, data);
}
