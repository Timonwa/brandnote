import type { AudienceId } from "./audiences";
import { getSupabase } from "./supabase";

export type WelcomeDraftStatus = "pending" | "approved" | "sent" | "failed";

export type WelcomeDraft = {
  id: string;
  userId: string;
  email: string;
  businessName: string;
  audience: AudienceId;
  subject: string;
  body: string;
  agentNote: string;
  tokenId: string | null;
  status: WelcomeDraftStatus;
  createdAt: string;
  approvedAt: string | null;
  sentAt: string | null;
};

type WelcomeDraftRow = {
  id: string;
  user_id: string;
  email: string;
  business_name: string;
  audience: AudienceId;
  subject: string;
  body: string;
  agent_note: string;
  token_id: string | null;
  status: WelcomeDraftStatus;
  created_at: string;
  approved_at: string | null;
  sent_at: string | null;
};

function toWelcomeDraft(row: WelcomeDraftRow): WelcomeDraft {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    businessName: row.business_name,
    audience: row.audience,
    subject: row.subject,
    body: row.body,
    agentNote: row.agent_note,
    tokenId: row.token_id,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
  };
}

export type WelcomeApproval = { subject: string; body: string };

// Upserts on the approval token, so a retried run updates its draft instead of adding a second one.
export async function saveWelcomeDraft(input: {
  userId: string;
  email: string;
  businessName: string;
  audience: AudienceId;
  subject: string;
  body: string;
  agentNote: string;
  tokenId: string;
}): Promise<WelcomeDraft> {
  const { data, error } = await getSupabase()
    .from("welcome_drafts")
    .upsert(
      {
        user_id: input.userId,
        email: input.email,
        business_name: input.businessName,
        audience: input.audience,
        subject: input.subject,
        body: input.body,
        agent_note: input.agentNote,
        token_id: input.tokenId,
      },
      { onConflict: "token_id" },
    )
    .select("*")
    .single<WelcomeDraftRow>();
  if (error) throw error;
  return toWelcomeDraft(data);
}

export async function listWelcomeDrafts(): Promise<WelcomeDraft[]> {
  const { data, error } = await getSupabase()
    .from("welcome_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<WelcomeDraftRow[]>();
  if (error) throw error;
  return data.map(toWelcomeDraft);
}

export async function getWelcomeDraft(id: string): Promise<WelcomeDraft | null> {
  const { data, error } = await getSupabase()
    .from("welcome_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle<WelcomeDraftRow>();
  if (error) throw error;
  return data ? toWelcomeDraft(data) : null;
}

export async function approveWelcomeDraft(id: string, edits: WelcomeApproval): Promise<void> {
  const { error } = await getSupabase()
    .from("welcome_drafts")
    .update({
      subject: edits.subject,
      body: edits.body,
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw error;
}

// Saves what was actually sent, in case the agent finishes before the approval is recorded.
export async function markWelcomeDraftSent(id: string, sent: WelcomeApproval): Promise<void> {
  const { error } = await getSupabase()
    .from("welcome_drafts")
    .update({
      subject: sent.subject,
      body: sent.body,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function markWelcomeDraftFailed(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("welcome_drafts")
    .update({ status: "failed" })
    .eq("id", id);
  if (error) throw error;
}
