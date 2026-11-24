import { webhook, webhooks } from "@trigger.dev/sdk";
import type { WebhookEvent } from "@clerk/backend";
import { onboardNewUser } from "./onboard-new-user";

// Verifies Clerk's signature on every delivery before anything runs.
export const clerk = webhooks.endpoint.define({
  id: "clerk",
  source: webhooks.clerk<WebhookEvent>(),
});

export const clerkUserCreated = webhook({
  id: "clerk-user-created",
  endpoint: clerk,
  filter: "event.type == 'user.created'",
  onEvent: async ({ event }) => {
    // The key makes a resent event a no-op instead of onboarding the same user twice.
    await onboardNewUser.trigger(
      { userId: event.data.id },
      { idempotencyKey: `onboard-${event.data.id}` },
    );
  },
});
