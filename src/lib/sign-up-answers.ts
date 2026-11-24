import { z } from "zod";
import { AUDIENCE_IDS } from "./audiences";

export const signUpAnswersSchema = z.object({
  businessName: z.string().trim().min(1, "Enter your business name").max(100),
  website: z.url({
    protocol: /^https?$/,
    message: "Enter a link that starts with http:// or https://",
  }),
  audience: z.enum(AUDIENCE_IDS, { message: "Pick your role" }),
});

export type SignUpAnswers = z.infer<typeof signUpAnswersSchema>;

// People type "acme.com" far more often than "https://acme.com".
export function normalizeWebsite(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "" || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
