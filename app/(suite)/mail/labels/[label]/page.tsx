import LabelPageClient from "./LabelPageClient";

export function generateStaticParams() {
  return [{ label: "_" }];
}

export default function LabelPage() {
  return <LabelPageClient />;
}
