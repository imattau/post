import { Suspense } from "react";
import DriveWorkspace from "../_components/DriveWorkspace";

export default function DriveSharedPage() {
  return <Suspense fallback={null}><DriveWorkspace screen="shared" /></Suspense>;
}
