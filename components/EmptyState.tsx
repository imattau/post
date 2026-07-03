export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      {icon && <span className="text-[32px] text-text-tertiary mb-3">{icon}</span>}
      <p className="text-[15px] font-medium text-text-secondary">{title}</p>
      {description && <p className="text-[13px] text-text-tertiary mt-1 max-w-[280px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
