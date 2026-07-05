import { Suspense } from "react";
import DriveWorkspace from "../_components/DriveWorkspace";

export default function DriveStarredPage() {
  return <Suspense fallback={null}><DriveWorkspace screen="starred" /></Suspense>;
}
