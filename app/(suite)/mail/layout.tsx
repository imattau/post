import { Suspense } from "react";
import MailContent from "./_components/MailContent";
import MailErrorBoundary from "./_components/MailErrorBoundary";

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <MailErrorBoundary>
      <Suspense fallback={null}>
        <MailContent>{children}</MailContent>
      </Suspense>
    </MailErrorBoundary>
  );
}
