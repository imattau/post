const AVATAR_COLORS = [
  "var(--color-avatar-1)",
  "var(--color-avatar-2)",
  "var(--color-avatar-3)",
  "var(--color-avatar-4)",
  "var(--color-avatar-5)",
  "var(--color-avatar-6)",
  "var(--color-avatar-7)",
];

function hashInitials(initials: string): number {
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({
  initials,
  size = 40,
  className = "",
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  const colorIndex = hashInitials(initials) % AVATAR_COLORS.length;
  const fontSizes: Record<number, number> = { 36: 10, 40: 11, 46: 14 };
  const fontSize = fontSizes[size] ?? Math.round(size * 0.28);

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_COLORS[colorIndex],
      }}
    >
      <span
        className="text-white font-semibold select-none"
        style={{ fontSize: fontSize, lineHeight: 1 }}
      >
        {initials}
      </span>
    </div>
  );
}
