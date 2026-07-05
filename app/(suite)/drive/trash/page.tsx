import { Suspense } from "react";
import DriveWorkspace from "../_components/DriveWorkspace";

export default function DriveTrashPage() {
  return <Suspense fallback={null}><DriveWorkspace screen="trash" /></Suspense>;
}
