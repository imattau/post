"use client";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Calendar error:", error);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-canvas px-6">
      <div className="max-w-sm text-center">
        <h2 className="text-[18px] font-semibold text-text-near-white">Something went wrong</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          An unexpected error occurred while loading the calendar. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 h-10 rounded-pill bg-brand px-6 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
