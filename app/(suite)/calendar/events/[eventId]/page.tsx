import EventPageClient from "./EventPageClient";

export function generateStaticParams() {
  return [{ eventId: "_" }];
}

export default function EventPage() {
  return <EventPageClient />;
}
