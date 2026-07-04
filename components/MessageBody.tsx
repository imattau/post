import { memo } from "react";
import dynamic from "next/dynamic";
import type { Components } from "react-markdown";

const MarkdownRenderer = dynamic(() => import("./MarkdownRenderer"), {
  ssr: false,
});

const components: Components = {
  p: ({ children }) => (
    <p className="text-[14px] leading-6 text-text-near-white [&_code]:text-[13px] [&_code]:bg-pill-subtle [&_code]:px-1 [&_code]:rounded">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="flex flex-col gap-1 list-none pl-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex flex-col gap-1 list-none pl-0">{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li {...props} className="flex gap-2 text-[13px] leading-6 text-text-near-white [&>p]:m-0">
      <span className="w-[6px] h-[6px] rounded-full bg-brand-light mt-[9px] flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  h1: ({ children }) => (
    <p className="font-semibold text-[14px] text-text-primary mt-4 mb-1">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="font-semibold text-[14px] text-text-primary mt-4 mb-1">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="font-semibold text-[14px] text-text-primary mt-4 mb-1">{children}</p>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-brand-light underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="bg-pill-subtle rounded-[8px] p-3 overflow-x-auto text-[13px] leading-5 my-2">{children}</pre>
  ),
  code: ({ children }) => (
    <code className="text-[13px] bg-pill-subtle px-1 rounded">{children}</code>
  ),
};

const MessageBody = memo(function MessageBody({ body }: { body: string }) {
  if (!body) return null;
  return (
    <div className="max-w-[570px]">
      <MarkdownRenderer body={body} components={components} />
    </div>
  );
});

export default MessageBody;
