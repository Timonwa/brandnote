"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { approveWelcomeDraft, getWelcomeDraft } from "@/lib/welcome-drafts";

const approveSchema = z.object({
  id: z.uuid(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
});

export async function approveWelcomeDraftAction(formData: FormData) {
  // Server actions are public endpoints, so the admin check runs here too, not just on the page.
  await requireAdmin();

  const { id, subject, body } = approveSchema.parse({
    id: formData.get("id"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  const draft = await getWelcomeDraft(id);
  if (!draft || draft.status !== "pending") return;

  await approveWelcomeDraft(id, { subject, body });

  refresh();
}
