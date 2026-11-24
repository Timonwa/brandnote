export const AUDIENCES = [
  { id: "founder", label: "Founder or business owner" },
  { id: "in_house", label: "On a marketing team" },
  { id: "agency", label: "Agency, marketing for clients" },
  { id: "freelancer", label: "Freelancer, marketing for clients" },
  { id: "other", label: "Something else" },
] as const;

export type AudienceId = (typeof AUDIENCES)[number]["id"];

export const AUDIENCE_IDS = AUDIENCES.map((audience) => audience.id) as [
  AudienceId,
  ...AudienceId[],
];

export function getAudienceLabel(id: AudienceId): string {
  return AUDIENCES.find((audience) => audience.id === id)?.label ?? id;
}
