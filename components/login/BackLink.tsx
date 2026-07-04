import Link from "next/link";

export default function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-[11px] font-medium text-brand-light hover:brightness-110 transition-all"
    >
      ← Back
    </Link>
  );
}
