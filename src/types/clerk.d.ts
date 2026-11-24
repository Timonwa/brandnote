import type { AudienceId } from "@/lib/audiences";

declare global {
  interface SignUpUnsafeMetadata {
    businessName?: string;
    website?: string;
    audience?: AudienceId;
  }

  interface UserUnsafeMetadata {
    businessName?: string;
    website?: string;
    audience?: AudienceId;
  }

  interface UserPublicMetadata {
    role?: "admin";
  }
}

export {};
