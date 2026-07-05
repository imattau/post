import { Suspense } from "react";
import DriveWorkspace from "../_components/DriveWorkspace";

export default function DriveFromPostPage() {
  return <Suspense fallback={null}><DriveWorkspace screen="from-post" /></Suspense>;
}
