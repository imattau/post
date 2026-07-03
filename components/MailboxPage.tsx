export default function MailboxPage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h2 className="text-[22px] font-semibold text-white">{title}</h2>
          <p className="text-text-secondary text-[11px]">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-tertiary text-[13px]">No messages</p>
      </div>
    </>
  );
}
