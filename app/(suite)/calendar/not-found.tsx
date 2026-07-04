import Link from "next/link";

export default function CalendarNotFound() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-canvas px-6">
      <div className="text-center">
        <h1 className="text-[48px] font-bold text-text-primary">404</h1>
        <p className="mt-2 text-[15px] text-text-secondary">Page not found</p>
        <Link
          href="/calendar"
          className="mt-4 inline-block text-[13px] font-medium text-brand-light"
        >
          ← Back to calendar
        </Link>
      </div>
    </div>
  );
}
