import Link from "next/link";

const WHAT_YOU_GET = [
  {
    title: "Brand profile",
    description: "What you sell, who you sell to, and what makes you different.",
  },
  {
    title: "Brand voice",
    description: "How you sound, the words you use, and the words you avoid.",
  },
  {
    title: "Customer profiles",
    description: "The kinds of customer you serve, and the problem you solve for each.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-sm font-medium text-emerald-700">AI marketing, set up for you</p>
      <h1 className="mt-3 max-w-2xl text-5xl font-semibold tracking-tight">
        Give us your website. We&apos;ll set up your brand.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-stone-600">
        Brandnote reads your site and fills in your brand profile, voice and customers, so
        every piece of marketing starts from the same place.
      </p>
      <Link
        href="/sign-up"
        className="mt-10 inline-block rounded-full bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-700"
      >
        Get started
      </Link>

      <ul className="mt-20 grid gap-6 sm:grid-cols-3">
        {WHAT_YOU_GET.map((item) => (
          <li key={item.title} className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
