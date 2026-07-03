function renderLine(line: string, i: number) {
  const trimmed = line.trim();

  if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
    return (
      <div key={i} className="flex gap-2 text-[13px] leading-6 text-text-near-white">
        <span className="w-[6px] h-[6px] rounded-full bg-brand-light mt-[9px] flex-shrink-0" />
        <span>{trimmed.slice(2)}</span>
      </div>
    );
  }

  if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
    return (
      <p key={i} className="font-semibold text-[14px] text-text-primary mt-4 mb-1">
        {trimmed.slice(2, -2)}
      </p>
    );
  }

  if (trimmed.startsWith("1. ")) {
    return (
      <div key={i} className="flex gap-2 text-[13px] leading-6 text-text-near-white">
        <span className="text-text-secondary font-medium w-4 flex-shrink-0">
          {trimmed.split(". ")[0]}.
        </span>
        <span>{trimmed.slice(trimmed.indexOf(". ") + 2)}</span>
      </div>
    );
  }

  if (trimmed === "") {
    return <div key={i} className="h-2" />;
  }

  const bold = trimmed.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return (
    <p key={i} className="text-[14px] leading-6 text-text-near-white">
      {bold}
    </p>
  );
}

export default function MessageBody({ body }: { body: string }) {
  const lines = body.split("\n");
  return <div className="pl-8 pr-6 pt-3 pb-2">{lines.map(renderLine)}</div>;
}
