import MailboxPageClient from "./MailboxPageClient";

export function generateStaticParams() {
  return ["inbox", "starred", "snoozed", "sent", "drafts", "archive", "spam"].map((mailbox) => ({ mailbox }));
}

export default function MailboxPage() {
  return <MailboxPageClient />;
}
