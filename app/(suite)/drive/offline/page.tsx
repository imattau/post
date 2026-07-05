import { Suspense } from "react";
import DriveWorkspace from "../_components/DriveWorkspace";

export default function DriveOfflinePage() {
  return <Suspense fallback={null}><DriveWorkspace screen="offline" /></Suspense>;
}
