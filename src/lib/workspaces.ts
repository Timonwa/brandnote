import { z } from "zod";
import type { AudienceId } from "./audiences";
import { getSupabase } from "./supabase";

export const brandProfileSchema = z.object({
  summary: z.string().describe("One sentence on what the business is"),
  whatTheySell: z.string(),
  whoTheySellTo: z.string(),
  whatMakesThemDifferent: z.string(),
});

export const brandVoiceSchema = z.object({
  description: z
    .string()
    .describe('How they sound in a few words, e.g. "friendly and direct"'),
  wordsTheyUse: z.array(z.string()).max(8),
  wordsToAvoid: z.array(z.string()).max(8),
  exampleSentence: z.string().describe("One new sentence written in their voice"),
});

export const customerProfileSchema = z.object({
  name: z.string().describe('A short label, e.g. "Ops lead at a small logistics company"'),
  description: z.string(),
  problemTheySolve: z.string(),
});

export type BrandProfile = z.infer<typeof brandProfileSchema>;
export type BrandVoice = z.infer<typeof brandVoiceSchema>;
export type CustomerProfile = z.infer<typeof customerProfileSchema>;

export type WorkspaceStatus = "setting_up" | "ready" | "failed";

export type Workspace = {
  userId: string;
  businessName: string;
  website: string;
  audience: AudienceId;
  status: WorkspaceStatus;
  brandProfile: BrandProfile | null;
  brandVoice: BrandVoice | null;
  customerProfiles: CustomerProfile[];
  pagesRead: string[];
  updatedAt: string;
};

type WorkspaceRow = {
  user_id: string;
  business_name: string;
  website: string;
  audience: AudienceId;
  status: WorkspaceStatus;
  brand_profile: BrandProfile | null;
  brand_voice: BrandVoice | null;
  customer_profiles: CustomerProfile[] | null;
  pages_read: string[] | null;
  updated_at: string;
};

function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    userId: row.user_id,
    businessName: row.business_name,
    website: row.website,
    audience: row.audience,
    status: row.status,
    brandProfile: row.brand_profile,
    brandVoice: row.brand_voice,
    customerProfiles: row.customer_profiles ?? [],
    pagesRead: row.pages_read ?? [],
    updatedAt: row.updated_at,
  };
}

export async function getWorkspace(userId: string): Promise<Workspace | null> {
  const { data, error } = await getSupabase()
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<WorkspaceRow>();
  if (error) throw error;
  return data ? toWorkspace(data) : null;
}

export async function startWorkspace(input: {
  userId: string;
  businessName: string;
  website: string;
  audience: AudienceId;
}): Promise<void> {
  const { error } = await getSupabase().from("workspaces").upsert({
    user_id: input.userId,
    business_name: input.businessName,
    website: input.website,
    audience: input.audience,
    status: "setting_up",
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function completeWorkspace(
  userId: string,
  content: {
    brandProfile: BrandProfile;
    brandVoice: BrandVoice;
    customerProfiles: CustomerProfile[];
    pagesRead: string[];
  },
): Promise<void> {
  const { error } = await getSupabase()
    .from("workspaces")
    .update({
      status: "ready",
      brand_profile: content.brandProfile,
      brand_voice: content.brandVoice,
      customer_profiles: content.customerProfiles,
      pages_read: content.pagesRead,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function failWorkspace(userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("workspaces")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}
