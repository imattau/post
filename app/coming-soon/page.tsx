export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app } = await searchParams;
  return (
    <div className="h-dvh flex items-center justify-center bg-canvas">
      <div className="text-center">
        <h1 className="text-[48px] font-bold text-brand mb-4">
          {app || "?"}
        </h1>
        <p className="text-text-secondary text-[15px]">Coming soon</p>
        <a
          href="/mail/inbox"
          className="inline-block mt-6 text-brand-light text-[13px] font-medium hover:brightness-110"
        >
          ← Back to Post
        </a>
      </div>
    </div>
  );
}
