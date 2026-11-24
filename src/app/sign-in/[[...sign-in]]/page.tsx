import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex justify-center px-6 py-16">
      {/* Clerk's form reads the URL, which only exists at request time. */}
      <Suspense>
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/workspace" />
      </Suspense>
    </div>
  );
}
