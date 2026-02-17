import { getSupabaseServer } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ feature?: string }>;
}

export default async function UpgradePage({ searchParams }: Props) {
  const { feature } = await searchParams;

  // Look up feature description if available
  let featureDescription: string | null = null;
  if (feature) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data } = await supabase
        .from("features")
        .select("description")
        .eq("key", feature)
        .single();
      featureDescription = data?.description ?? null;
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <svg
            className="h-6 w-6 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Upgrade Required
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {featureDescription
            ? `"${featureDescription}" is not included in your current plan.`
            : "This feature is not included in your current plan."}
        </p>

        {feature && (
          <p className="mt-1 font-mono text-xs text-zinc-400 dark:text-zinc-600">
            {feature}
          </p>
        )}

        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Contact your administrator to upgrade your plan.
        </p>

        <a
          href="/admin"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
