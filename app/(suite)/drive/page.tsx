import { Suspense } from "react";
import DriveWorkspace from "./_components/DriveWorkspace";

export default function DrivePage() {
  return <Suspense fallback={null}><DriveWorkspace screen="my-files" /></Suspense>;
}
