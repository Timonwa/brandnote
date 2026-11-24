import { Suspense } from "react";
import { RefreshWhilePending } from "@/components/refresh-while-pending";
import { SubmitButton } from "@/components/submit-button";
import { getAudienceLabel } from "@/lib/audiences";
import { requireAdmin } from "@/lib/auth";
import { listWelcomeDrafts, type WelcomeDraft } from "@/lib/welcome-drafts";
import { approveWelcomeDraftAction } from "./actions";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome emails</h1>
      <p className="mt-2 text-stone-600">
        Every new signup gets a welcome written by the agent. Read it, edit anything, then
        approve it to send.
      </p>
      <Suspense fallback={<p className="mt-8 text-stone-500">Loading drafts…</p>}>
        <DraftQueue />
      </Suspense>
    </div>
  );
}

async function DraftQueue() {
  await requireAdmin();
  const drafts = await listWelcomeDrafts();
  const pending = drafts.filter((draft) => draft.status === "pending");
  const done = drafts.filter((draft) => draft.status !== "pending");
  const isSending = drafts.some((draft) => draft.status === "approved");

  return (
    <div className="mt-10 space-y-12">
      {/* The agent sends in the background, so the page polls until it reports back. */}
      {isSending && <RefreshWhilePending />}
      <section>
        <h2 className="text-sm font-medium tracking-wide text-stone-500 uppercase">
          Waiting for you ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-4 text-stone-500">No welcomes waiting. New signups appear here.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {pending.map((draft) => (
              <li key={draft.id}>
                <PendingDraft draft={draft} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-medium tracking-wide text-stone-500 uppercase">
            Recent
          </h2>
          <ul className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {done.map((draft) => (
              <li key={draft.id}>
                <details className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{draft.subject}</p>
                      <p className="text-sm text-stone-500">
                        {draft.businessName} · {draft.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={draft.status} />
                      <span className="text-sm text-stone-400 group-open:hidden">View</span>
                      <span className="hidden text-sm text-stone-400 group-open:inline">Hide</span>
                    </div>
                  </summary>
                  <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 text-sm">
                    <p className="text-stone-500">{describeWhen(draft)}</p>
                    {draft.agentNote && (
                      <div className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900">
                        <span className="font-medium">Note from the agent: </span>
                        {draft.agentNote}
                      </div>
                    )}
                    <p className="whitespace-pre-line leading-relaxed">{draft.body}</p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PendingDraft({ draft }: { draft: WelcomeDraft }) {
  return (
    <details open className="group rounded-2xl border border-stone-200 bg-white p-6">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{draft.businessName}</p>
        <div className="flex items-baseline gap-3">
          <p className="text-sm text-stone-500">
            {draft.email} · {getAudienceLabel(draft.audience)}
          </p>
          <span className="text-sm text-stone-400 group-open:hidden">Show</span>
          <span className="hidden text-sm text-stone-400 group-open:inline">Hide</span>
        </div>
      </summary>

      <form action={approveWelcomeDraftAction}>
        <input type="hidden" name="id" value={draft.id} />

        {draft.agentNote && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-medium">Note from the agent: </span>
            {draft.agentNote}
          </div>
        )}

        <label htmlFor={`subject-${draft.id}`} className="mt-5 block text-sm font-medium">
          Subject
        </label>
        <input
          id={`subject-${draft.id}`}
          name="subject"
          defaultValue={draft.subject}
          className="input mt-1"
        />

        <label htmlFor={`body-${draft.id}`} className="mt-4 block text-sm font-medium">
          Email
        </label>
        <textarea
          id={`body-${draft.id}`}
          name="body"
          defaultValue={draft.body}
          rows={10}
          className="input mt-1 leading-relaxed"
        />

        <div className="mt-5 flex justify-end">
          <SubmitButton pendingLabel="Approving…">Approve and send</SubmitButton>
        </div>
      </form>
    </details>
  );
}

const STATUS_STYLES: Record<Exclude<WelcomeDraft["status"], "pending">, string> = {
  approved: "bg-sky-50 text-sky-800",
  sent: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
};

function StatusBadge({ status }: { status: WelcomeDraft["status"] }) {
  if (status === "pending") return null;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status === "approved" ? "Approved, sending" : status === "sent" ? "Sent" : "Failed"}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function describeWhen(draft: WelcomeDraft): string {
  if (draft.sentAt) return `Sent ${formatDate(draft.sentAt)}`;
  if (draft.approvedAt) return `Approved ${formatDate(draft.approvedAt)}`;
  return `Drafted ${formatDate(draft.createdAt)}`;
}
