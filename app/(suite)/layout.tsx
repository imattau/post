import { Toaster } from "sonner";
import IconDock from "@/components/IconDock";

export default function SuiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <IconDock />
      {children}
      <Toaster />
    </div>
  );
}
