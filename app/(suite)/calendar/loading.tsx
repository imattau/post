export default function CalendarLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-4 text-[13px] text-text-secondary">Loading calendar…</p>
      </div>
    </div>
  );
}
