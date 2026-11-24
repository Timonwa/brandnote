import { Suspense } from "react";
import { SignUpFlow } from "@/components/sign-up-flow";

export default function SignUpPage() {
  return (
    <div className="flex justify-center px-6 py-16">
      {/* Clerk's form reads the URL, which only exists at request time. */}
      <Suspense>
        <SignUpFlow />
      </Suspense>
    </div>
  );
}
