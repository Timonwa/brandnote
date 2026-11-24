import { createClerkClient } from "@clerk/backend";

const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm invite-admin admin@yourdomain.com");
  process.exit(1);
}

const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  console.error("Set CLERK_SECRET_KEY in your .env file first.");
  process.exit(1);
}

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const clerk = createClerkClient({ secretKey });

// The role rides on the invitation, so the account has it from the moment it's created
// and the onboarding agent never treats the admin as a new customer.
const invitation = await clerk.invitations.createInvitation({
  emailAddress: email,
  publicMetadata: { role: "admin" },
  redirectUrl: `${appUrl}/sign-up`,
  notify: true,
  ignoreExisting: true,
});

console.log(`Invited ${invitation.emailAddress} as an admin. Clerk has emailed the link; here it is too:`);
console.log(invitation.url);
