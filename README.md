# Brandnote

Brandnote is a demo AI marketing app. When someone signs up with their website, a Clerk webhook starts an AI agent on Trigger.dev. The agent reads their site, sets up their brand profile, brand voice and customer profiles, and drafts a welcome email that waits for an admin to approve it before it's sent.

It's the example project for a Trigger.dev tutorial on building an onboarding agent with Clerk webhooks.

## Branches

| Branch    | What's in it                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `starter` | The app without the agent: Clerk sign-up, the workspace page, the admin approval page and the Supabase tables. Start the tutorial here. |
| `main`    | The finished project, with the Trigger.dev webhook and the onboarding agent.                                                           |

## How it works

1. A user signs up with their business name, website and role. Clerk saves the answers on the user.
2. Clerk sends `user.created` to a Trigger.dev webhook ([`src/trigger/clerk-webhook.ts`](src/trigger/clerk-webhook.ts)), which starts the onboarding agent with just the user's ID.
3. The agent ([`src/trigger/onboard-new-user.ts`](src/trigger/onboard-new-user.ts)) fetches the user from Clerk, reads up to five pages of their site, and saves their brand profile, brand voice and customer profiles.
4. It writes a welcome email from the template for their audience ([`src/lib/welcome-templates.ts`](src/lib/welcome-templates.ts)) and pauses on a wait token.
5. An admin edits and approves the draft on `/admin`, which completes the token. The agent wakes up and sends the email with ZeptoMail.

## Quickstart

You need Node.js 22 or later, pnpm, and accounts with [Clerk](https://clerk.com), [Supabase](https://supabase.com), [Trigger.dev](https://trigger.dev), [Google AI Studio](https://aistudio.google.com) (for a Gemini API key) and [ZeptoMail](https://www.zoho.com/zeptomail/).

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment file and fill it in (see the table below):

   ```bash
   cp .env.example .env.local
   ```

3. Create the tables: open your Supabase project's SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).

4. In [`trigger.config.ts`](trigger.config.ts), replace the `project` value with your own Trigger.dev project ref. It starts with `proj_` and is in your project's settings.

5. Start the app and the Trigger.dev dev server, in two terminals. Keep `pnpm dev:trigger` running from a signup until its welcome is approved: in dev, the waiting run lives in that process.

   ```bash
   pnpm dev
   pnpm dev:trigger
   ```

6. Connect Clerk to the webhook:
   1. In the Trigger.dev dashboard, open **Webhooks**, select the `clerk` endpoint and copy its webhook URL.
   2. In the Clerk dashboard, open **Webhooks**, add an endpoint with that URL and subscribe it to `user.created`.
   3. Copy the endpoint's signing secret (it starts with `whsec_`) and paste it into **Set signing secret** on the Trigger.dev endpoint.

7. Invite yourself as an admin (see below), then sign up at http://localhost:3000 with a different email address.

## Environment variables

| Variable                            | Where to find it                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys                                                                    |
| `CLERK_SECRET_KEY`                  | Clerk dashboard → API keys                                                                    |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Leave as `/sign-in`                                                                           |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Leave as `/sign-up`                                                                           |
| `SUPABASE_URL` | Supabase → **Connect** (top of the project) → **Server** → `SUPABASE_URL` |
| `SUPABASE_SECRET_KEY` | Supabase → **Connect** (top of the project) → **Server** → `SUPABASE_SECRET_KEY` |
| `APP_URL`                           | Where the app runs; defaults to `http://localhost:3000`. Used in invitation and email links.   |
| `TRIGGER_SECRET_KEY`                | Trigger.dev → API keys. Needs **Waitpoints: Read and write** (the Operator preset has it).     |
| `GOOGLE_GENERATIVE_AI_API_KEY`      | Google AI Studio → Get API key                                                                |
| `ZEPTOMAIL_TOKEN`                   | ZeptoMail → your Mail Agent → SMTP/API → Send Mail token                                      |
| `ZEPTOMAIL_FROM_ADDRESS`            | An address on a domain you've verified in ZeptoMail                                            |
| `ZEPTOMAIL_FROM_NAME`               | The sender name, e.g. `Brandnote`                                                             |

## Make yourself an admin

The admin page at `/admin` lists welcome drafts waiting for approval. Admins join by invitation, with the admin role already on the invitation, so the onboarding agent never mistakes them for a new customer.

1. With `pnpm dev` running, create the invitation. Clerk emails the link, and the script prints it too:

   ```bash
   pnpm invite-admin admin@yourdomain.com
   ```

2. Open the link and finish signing up. You land on `/admin`.

Use a different email address from the one you test sign-ups with.

## How it's built

- **Next.js 16** (App Router, Cache Components) with Tailwind CSS.
- **Clerk** for sign-up and sign-in. The sign-up form's extra answers are saved on the user as unsafe metadata.
- **Trigger.dev** for the Clerk webhook, the agent's run, and the wait for approval.
- **AI SDK** with **Gemini**. Every model and tool call shows as a span in the Trigger.dev run trace.
- **Supabase** stores workspaces and welcome drafts. In your own product, this is your database.
- **ZeptoMail** sends the approved welcome email.

## Scripts

| Script                      | What it does                       |
| --------------------------- | ---------------------------------- |
| `pnpm dev`                  | Starts the app on port 3000        |
| `pnpm dev:trigger`          | Starts the Trigger.dev dev server  |
| `pnpm build`                | Builds the app for production      |
| `pnpm lint`                 | Runs ESLint                        |
| `pnpm invite-admin <email>` | Creates an admin invitation and prints its link |

## License

Apache 2.0
