import MailboxPage from "@/components/MailboxPage";

export default async function LabelPage({ params }: { params: Promise<{ label: string }> }) {
  const { label } = await params;
  return <MailboxPage title={`Label: ${label}`} subtitle={`Messages labeled "${label}"`} />;
}
