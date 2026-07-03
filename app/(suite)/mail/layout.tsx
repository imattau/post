import { Suspense } from "react";
import MailContent from "./_components/MailContent";

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MailContent>{children}</MailContent>
    </Suspense>
  );
}
