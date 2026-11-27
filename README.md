# Brandnote (starter)

Brandnote is a demo AI marketing app. This branch is the app **before** the AI agent: people can sign up with their website, and admins can approve welcome emails, but nothing reads the site or writes the email yet. The Trigger.dev tutorial builds that agent on top of this branch.

## Branches

| Branch    | What's in it                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `starter` | The app without the agent: Clerk sign-up, the workspace page, the admin approval page and the Supabase tables. Start the tutorial here. |
| `main`    | The finished project, with the Trigger.dev webhook and the onboarding agent.                                                           |

## What's here

- **Sign-up** asks for a business name, a website and the person's role, then hands over to Clerk. Clerk saves the answers on the user.
- **The workspace page** (`/workspace`) shows a business's brand profile, brand voice and customer profiles. Until the agent exists, it stays on "Setting up".
- **The admin page** (`/admin`) lists welcome drafts to edit and approve.
- **Supabase** stores workspaces and welcome drafts. In your own product, this is your database.
- **Ready-made helpers the agent will use:**
  - [`src/lib/welcome-templates.ts`](src/lib/welcome-templates.ts): the welcome email's structure and the "how we help" line for each role.
  - [`src/lib/read-page.ts`](src/lib/read-page.ts): fetches a web page and returns its text and links.
  - [`src/lib/email.ts`](src/lib/email.ts): sends an email through ZeptoMail.
  - [`src/lib/workspaces.ts`](src/lib/workspaces.ts) and [`src/lib/welcome-drafts.ts`](src/lib/welcome-drafts.ts): save the agent's work.

## What the tutorial adds

1. Trigger.dev in the project.
2. A Trigger.dev webhook that Clerk calls when someone signs up.
3. The onboarding agent: it reads the new user's site, sets up their workspace and writes their welcome email.
4. A wait for an admin's approval, then sending the email.

## Quickstart

You need Node.js 22 or later, pnpm, and accounts with [Clerk](https://clerk.com), [Supabase](https://supabase.com) and [ZeptoMail](https://www.zoho.com/zeptomail/).

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment file and fill it in (see the table below):

   ```bash
   cp .env.example .env.local
   ```

3. Create the tables: open your Supabase project's SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).

4. In Clerk, under **User & authentication**, turn on **First and last name**. The welcome email greets people by first name.

5. Start the app:

   ```bash
   pnpm dev
   ```

6. Invite yourself as an admin (see below), then sign up at http://localhost:3000 with a different email address.

## Environment variables

| Variable                            | Where to find it                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys                                                                  |
| `CLERK_SECRET_KEY`                  | Clerk dashboard → API keys                                                                  |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Leave as `/sign-in`                                                                         |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Leave as `/sign-up`                                                                         |
| `SUPABASE_URL`                      | Supabase → **Connect** (top of the project) → **Server** → `SUPABASE_URL`                   |
| `SUPABASE_SECRET_KEY`               | Supabase → **Connect** (top of the project) → **Server** → `SUPABASE_SECRET_KEY`            |
| `APP_URL`                           | Where the app runs; defaults to `http://localhost:3000`. Used in invitation and email links. |
| `ZEPTOMAIL_TOKEN`                   | ZeptoMail → your Mail Agent → SMTP/API → Send Mail token                                    |
| `ZEPTOMAIL_FROM_ADDRESS`            | An address on a domain you've verified in ZeptoMail                                          |
| `ZEPTOMAIL_FROM_NAME`               | The sender name, e.g. `Brandnote`                                                           |
| `TRIGGER_SECRET_KEY` | Added in the tutorial's Step 3. Trigger.dev → API keys, with **Waitpoints: Read and write** access |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Added in the tutorial's Step 7. Google AI Studio → Get API key |
| `GEMINI_MODEL` | Optional, from the tutorial's Step 7. Defaults to `gemini-3.8-flash` |

## Make yourself an admin

The admin page at `/admin` lists welcome drafts waiting for approval. Admins join by invitation, with the admin role already on the invitation, so the onboarding agent never mistakes them for a new customer.

1. With `pnpm dev` running, create the invitation. Clerk emails the link, and the script prints it too:

   ```bash
   pnpm invite-admin admin@yourdomain.com
   ```

2. Open the link and finish signing up. You land on `/admin`.

Use a different email address from the one you test sign-ups with.

## Scripts

| Script                      | What it does                                    |
| --------------------------- | ----------------------------------------------- |
| `pnpm dev`                  | Starts the app on port 3000                     |
| `pnpm build`                | Builds the app for production                   |
| `pnpm lint`                 | Runs ESLint                                     |
| `pnpm invite-admin <email>` | Creates an admin invitation and prints its link |

## License

Apache 2.0
