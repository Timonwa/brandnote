"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignUp, useAuth } from "@clerk/nextjs";
import { AUDIENCES } from "@/lib/audiences";
import {
  normalizeWebsite,
  signUpAnswersSchema,
  type SignUpAnswers,
} from "@/lib/sign-up-answers";

type FieldErrors = Partial<Record<keyof SignUpAnswers, string>>;

export function SignUpFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [answers, setAnswers] = useState<SignUpAnswers | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const isInvitation = searchParams.has("__clerk_ticket");

  useEffect(() => {
    if (isSignedIn && !isInvitation) router.replace("/workspace");
  }, [isSignedIn, isInvitation, router]);

  // An invitation link carries a ticket. Invited admins aren't customers, so they skip the business questions.
  if (isInvitation) {
    return <SignUp routing="hash" signInUrl="/sign-in" forceRedirectUrl="/admin" />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = signUpAnswersSchema.safeParse({
      businessName: form.get("businessName"),
      website: normalizeWebsite(String(form.get("website") ?? "")),
      audience: form.get("audience"),
    });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignUpAnswers;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setAnswers(result.data);
  }

  // Clerk hides its form as soon as the account exists, a moment before the redirect lands.
  if (isSignedIn) {
    return <p className="text-stone-500">Taking you to your workspace…</p>;
  }

  if (answers) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Clerk copies unsafeMetadata onto the new user, so the agent can read these answers later. */}
        <SignUp
          routing="hash"
          unsafeMetadata={answers}
          signInUrl="/sign-in"
          forceRedirectUrl="/workspace"
        />
        <button
          type="button"
          onClick={() => setAnswers(null)}
          className="text-sm text-stone-500 underline hover:text-stone-900"
        >
          Change your business details
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Tell us about your business</h1>
      <p className="mt-2 text-sm text-stone-600">
        Brandnote reads your site to set up your brand. It takes about a minute.
      </p>

      <div className="mt-8 space-y-5">
        <Field label="Business name" name="businessName" error={errors.businessName}>
          <input
            id="businessName"
            name="businessName"
            autoComplete="organization"
            className="input"
            aria-invalid={Boolean(errors.businessName)}
          />
        </Field>

        <Field label="Website or portfolio link" name="website" error={errors.website}>
          <input
            id="website"
            name="website"
            type="url"
            inputMode="url"
            placeholder="acme.com"
            autoComplete="url"
            className="input"
            aria-invalid={Boolean(errors.website)}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">What&apos;s your role?</legend>
          <div className="mt-2 space-y-2">
            {AUDIENCES.map((audience) => (
              <label
                key={audience.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm has-checked:border-stone-900"
              >
                <input type="radio" name="audience" value={audience.id} />
                {audience.label}
              </label>
            ))}
          </div>
          {errors.audience && <p className="mt-1 text-sm text-red-700">{errors.audience}</p>}
        </fieldset>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-full bg-stone-900 px-4 py-2.5 font-medium text-white hover:bg-stone-700"
      >
        Continue
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
