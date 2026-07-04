"use client";

export default function AppFeatureCard({
  letter,
  color,
  title,
  description,
}: {
  letter: string;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center w-[384px] h-[62px] rounded-[14px] bg-sidebar border border-border px-4">
      <div className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-pill-subtle shrink-0">
        <span className="font-bold text-[14px]" style={{ color }}>{letter}</span>
      </div>
      <div className="ml-4">
        <p className="text-[13px] font-semibold text-text-near-white">{title}</p>
        <p className="text-[10px] font-normal text-text-tertiary">{description}</p>
      </div>
    </div>
  );
}
