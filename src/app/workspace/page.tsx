import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RefreshWhilePending } from "@/components/refresh-while-pending";
import { getAudienceLabel } from "@/lib/audiences";
import { getWorkspace, type Workspace } from "@/lib/workspaces";

export default function WorkspacePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Suspense fallback={<p className="text-stone-500">Loading your workspace…</p>}>
        <WorkspaceView />
      </Suspense>
    </div>
  );
}

async function WorkspaceView() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const workspace = await getWorkspace(user.id);
  const { businessName, website, audience } = user.unsafeMetadata;

  if (!workspace || workspace.status === "setting_up") {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-8">
        <RefreshWhilePending />
        <p className="text-sm font-medium text-emerald-700">Setting up</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Brandnote is reading {website ?? "your website"}
        </h1>
        <p className="mt-2 text-stone-600">
          Your brand profile, voice and customer profiles will appear here in a minute.
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <Detail label="Business" value={businessName} />
          <Detail label="Website" value={website} />
          <Detail label="Role" value={audience ? getAudienceLabel(audience) : undefined} />
        </dl>
      </section>
    );
  }

  if (workspace.status === "failed") {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          We couldn&apos;t set up your workspace
        </h1>
        <p className="mt-2 text-stone-600">
          Brandnote couldn&apos;t read {workspace.website}. Check the link is public and
          try again later.
        </p>
      </section>
    );
  }

  return <ReadyWorkspace workspace={workspace} />;
}

function ReadyWorkspace({ workspace }: { workspace: Workspace }) {
  const { brandProfile, brandVoice, customerProfiles } = workspace;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-stone-500">{workspace.website}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{workspace.businessName}</h1>
      </div>

      {brandProfile && (
        <Card title="Brand profile">
          <p className="text-lg">{brandProfile.summary}</p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-3">
            <Detail label="What you sell" value={brandProfile.whatTheySell} />
            <Detail label="Who you sell to" value={brandProfile.whoTheySellTo} />
            <Detail label="What makes you different" value={brandProfile.whatMakesThemDifferent} />
          </dl>
        </Card>
      )}

      {brandVoice && (
        <Card title="Brand voice">
          <p className="text-lg">{brandVoice.description}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <WordList label="Words you use" words={brandVoice.wordsTheyUse} />
            <WordList label="Words to avoid" words={brandVoice.wordsToAvoid} />
          </div>
          <blockquote className="mt-6 border-l-2 border-emerald-600 pl-4 text-stone-700 italic">
            {brandVoice.exampleSentence}
          </blockquote>
        </Card>
      )}

      {customerProfiles.length > 0 && (
        <Card title="Customer profiles">
          <ul className="grid gap-4 sm:grid-cols-2">
            {customerProfiles.map((customer) => (
              <li key={customer.name} className="rounded-xl bg-stone-50 p-5">
                <h3 className="font-semibold">{customer.name}</h3>
                <p className="mt-2 text-sm text-stone-600">{customer.description}</p>
                <p className="mt-3 text-sm">
                  <span className="font-medium">Problem you solve: </span>
                  {customer.problemTheySolve}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {workspace.pagesRead.length > 0 && (
        <p className="text-sm text-stone-500">
          Built from {workspace.pagesRead.length} page
          {workspace.pagesRead.length === 1 ? "" : "s"} on your site:{" "}
          {workspace.pagesRead.join(", ")}
        </p>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-8">
      <h2 className="text-sm font-medium tracking-wide text-stone-500 uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-1 font-medium">{value ?? "Not given"}</dd>
    </div>
  );
}

function WordList({ label, words }: { label: string; words: string[] }) {
  return (
    <div>
      <h3 className="text-sm text-stone-500">{label}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {words.map((word) => (
          <li key={word} className="rounded-full bg-stone-100 px-3 py-1 text-sm">
            {word}
          </li>
        ))}
      </ul>
    </div>
  );
}
