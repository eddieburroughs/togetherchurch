export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold tracking-tight">Together Church</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Church management made simple.
      </p>
      <a
        href="/login"
        className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Sign in
      </a>
    </main>
  );
}
