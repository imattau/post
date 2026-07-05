import { Suspense } from "react";
import DriveWorkspace from "../_components/DriveWorkspace";

export default function DriveRecentPage() {
  return <Suspense fallback={null}><DriveWorkspace screen="recent" /></Suspense>;
}
