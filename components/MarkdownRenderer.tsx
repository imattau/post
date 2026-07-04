import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const remarkPlugins = [remarkGfm];

export default function MarkdownRenderer({
  body,
  components,
}: {
  body: string;
  components: Components;
}) {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {body}
    </ReactMarkdown>
  );
}
