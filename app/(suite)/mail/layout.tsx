import { Suspense } from "react";
import MailContent from "./_components/MailContent";
import MailErrorBoundary from "./_components/MailErrorBoundary";

function MailSkeleton() {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-[248px_448px_1fr] divide-x divide-border">
      <div className="bg-sidebar pl-6 pr-4 pt-[25px]">
        <div className="h-[21px] w-16 bg-pill-subtle rounded mb-2" />
        <div className="h-12 w-[200px] bg-pill-subtle rounded-pill mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[38px] w-[216px] bg-pill-subtle rounded-[10px]" />
          ))}
        </div>
      </div>
      <div className="bg-canvas px-6 pt-[25px]">
        <div className="h-5 w-24 bg-pill-subtle rounded mb-2" />
        <div className="h-4 w-32 bg-pill-subtle rounded mb-4" />
        <div className="h-[42px] w-[400px] bg-pill-subtle rounded-[12px] mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] bg-pill-subtle rounded-pill" />
          ))}
        </div>
      </div>
      <div className="bg-dock" />
    </div>
  );
}

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <MailErrorBoundary>
      <Suspense fallback={<MailSkeleton />}>
        <MailContent>{children}</MailContent>
      </Suspense>
    </MailErrorBoundary>
  );
}
