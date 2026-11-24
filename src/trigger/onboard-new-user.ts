import { logger, schemaTask, wait } from "@trigger.dev/sdk";
import { generateText, hasToolCall, isStepCount, Output, registerTelemetry, tool } from "ai";
import { google } from "@ai-sdk/google";
import { OpenTelemetry } from "@ai-sdk/otel";
import { createClerkClient } from "@clerk/backend";
import { z } from "zod";
import { sendEmail } from "../lib/email";
import { isSameSite, readPage } from "../lib/read-page";
import { signUpAnswersSchema } from "../lib/sign-up-answers";
import {
  markWelcomeDraftFailed,
  markWelcomeDraftSent,
  saveWelcomeDraft,
  type WelcomeApproval,
} from "../lib/welcome-drafts";
import {
  HOW_WE_HELP,
  WELCOME_RULES,
  WELCOME_SIGNATURE,
  WELCOME_STRUCTURE,
} from "../lib/welcome-templates";
import {
  brandProfileSchema,
  brandVoiceSchema,
  completeWorkspace,
  customerProfileSchema,
  failWorkspace,
  startWorkspace,
} from "../lib/workspaces";

// Turns every AI SDK call below into a span in the run trace, with its prompts and tool calls.
registerTelemetry(new OpenTelemetry());

const model = google(process.env.GEMINI_MODEL ?? "gemini-3.8-flash");
// Free-tier Gemini often answers "high demand" for a few seconds; back off and retry instead of failing.
const MODEL_RETRIES = 5;
const MAX_PAGES = 5;

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const workspaceSchema = z.object({
  brandProfile: brandProfileSchema,
  brandVoice: brandVoiceSchema,
  customerProfiles: z.array(customerProfileSchema).min(1).max(2),
  noteForAdmin: z
    .string()
    .describe(
      [
        "A note that helps the Brandnote admin decide, in a few seconds, whether to approve this customer's welcome as it is or edit it first.",
        "Two short sentences in plain words, written to the admin about the customer (they, their).",
        "Sentence 1: what the business does and who for.",
        "Sentence 2: how sure you are. If something was unclear, say what and which part of the email to check, e.g. \"Their site had little text, so the customer profiles and the line about what they do are a best guess; check that paragraph.\" If everything was clear: \"Their site was clear, so the welcome should be accurate.\"",
        "Don't judge the role or anything else they gave at sign-up, don't summarise the email, don't copy their site's wording, don't address the customer, and don't list the pages or tools you used.",
      ].join(" "),
    ),
});

const welcomeSchema = z.object({
  subject: z.string(),
  body: z
    .string()
    .describe('The email in plain text, from the greeting to "Welcome aboard,". The signature is added after it.'),
});

export const onboardNewUser = schemaTask({
  id: "onboard-new-user",
  schema: z.object({ userId: z.string() }),
  retry: { maxAttempts: 4, minTimeoutInMs: 10_000, maxTimeoutInMs: 60_000, factor: 2 },
  // Runs once every attempt has failed, so the user doesn't wait on "setting up" forever.
  onFailure: async ({ payload }) => {
    await failWorkspace(payload.userId);
  },
  run: async ({ userId }) => {
    // The payload is only an ID. Fetching the user here means no personal data sits in old payloads.
    const user = await clerk.users.getUser(userId);

    if (user.publicMetadata.role === "admin") {
      logger.info("Skipping an admin account");
      return { status: "skipped", reason: "admin" };
    }

    const answers = signUpAnswersSchema.safeParse(user.unsafeMetadata);
    const email = user.primaryEmailAddress?.emailAddress;
    if (!answers.success || !email) {
      logger.warn("User has no sign-up answers or email", { userId });
      return { status: "skipped", reason: "missing sign-up answers" };
    }
    const { businessName, website, audience } = answers.data;

    await startWorkspace({ userId, businessName, website, audience });

    // 1. Research the site and set up the workspace.
    const pagesRead: string[] = [];
    let saved: z.infer<typeof workspaceSchema> | undefined;

    const research = await generateText({
      model,
      maxRetries: MODEL_RETRIES,
      system: [
        "You are Brandnote's onboarding agent. You set up a new customer's brand from their website.",
        "Read the link they gave first. Then pick the other pages on the same site that say most about what they sell, who they sell to and how they sound, such as About, Pricing, a product page or a case study.",
        `Read at most ${MAX_PAGES} pages in total. Skip blog archives, legal pages and log-in pages.`,
        "Base everything on what the pages say. Don't invent facts, customers or numbers.",
        "When you have enough, call saveWorkspace once.",
      ].join("\n"),
      prompt: `Business name: ${businessName}\nLink: ${website}`,
      tools: {
        readPage: tool({
          description:
            "Read one page on the customer's site. Returns its text and the links on it.",
          inputSchema: z.object({ url: z.url() }),
          execute: async ({ url }) => {
            if (!isSameSite(url, website)) {
              return { error: `Only pages on ${new URL(website).hostname} can be read.` };
            }
            if (pagesRead.length >= MAX_PAGES) {
              return { error: "Page limit reached. Save the workspace with what you have." };
            }
            try {
              const page = await readPage(url);
              pagesRead.push(page.url);
              return page;
            } catch (error) {
              return { error: error instanceof Error ? error.message : "Couldn't read the page" };
            }
          },
        }),
        saveWorkspace: tool({
          description: "Save the customer's brand profile, brand voice and customer profiles.",
          inputSchema: workspaceSchema,
          execute: async (workspace) => {
            await completeWorkspace(userId, { ...workspace, pagesRead });
            saved = workspace;
            return { saved: true };
          },
        }),
      },
      stopWhen: [hasToolCall("saveWorkspace"), isStepCount(MAX_PAGES + 3)],
    });

    if (!saved) {
      throw new Error(`The agent stopped without saving a workspace: ${research.finishReason}`);
    }

    // 2. Write the welcome. Picking the audience's wording is plain code; writing inside it is the agent's job.
    const workspaceUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/workspace`;

    const { output: welcome } = await generateText({
      model,
      maxRetries: MODEL_RETRIES,
      output: Output.object({ schema: welcomeSchema }),
      system: [
        "You write Brandnote's welcome emails to new customers. Follow this structure, in order:",
        ...WELCOME_STRUCTURE,
        "Rules:",
        ...WELCOME_RULES,
      ].join("\n"),
      prompt: [
        `First name: ${user.firstName ?? "(not given)"}`,
        `Business: ${businessName} (${website})`,
        `How we help: ${HOW_WE_HELP[audience]}`,
        `Workspace link: ${workspaceUrl}`,
        `What we set up from their website: ${JSON.stringify({
          brandProfile: saved.brandProfile,
          brandVoice: saved.brandVoice,
          customerProfiles: saved.customerProfiles,
        })}`,
      ].join("\n"),
    });

    // 3. Wait for the admin. The run is paused while it waits, so a draft can sit for days.
    const token = await wait.createToken({
      timeout: "7d",
      idempotencyKey: `welcome-approval-${userId}`,
    });

    const draft = await saveWelcomeDraft({
      userId,
      email,
      businessName,
      audience,
      subject: welcome.subject,
      body: `${welcome.body.trim()}\n\n${WELCOME_SIGNATURE}`,
      agentNote: saved.noteForAdmin,
      tokenId: token.id,
    });

    const approval = await wait.forToken<WelcomeApproval>(token);
    if (!approval.ok) {
      await markWelcomeDraftFailed(draft.id);
      return { status: "expired", draftId: draft.id };
    }

    // 4. Send what the admin approved, edits included.
    await sendEmail({
      to: email,
      toName: user.firstName ?? businessName,
      subject: approval.output.subject,
      text: approval.output.body,
    });
    await markWelcomeDraftSent(draft.id, approval.output);

    return { status: "sent", draftId: draft.id, pagesRead };
  },
});
