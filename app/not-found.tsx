export default function NotFound() {
  return (
    <div className="h-dvh flex items-center justify-center bg-canvas">
      <div className="text-center">
        <h1 className="text-[48px] font-bold text-text-primary">404</h1>
        <p className="text-text-secondary text-[15px] mt-2">Page not found</p>
        <a href="/mail/inbox" className="inline-block mt-4 text-brand-light text-[13px] font-medium">
          ← Back to inbox
        </a>
      </div>
    </div>
  );
}
