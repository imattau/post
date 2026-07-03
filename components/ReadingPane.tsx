"use client";

import type { MockMessage } from "@/lib/mock/threads";
import ReadingTopBar from "./ReadingTopBar";
import SubjectPills from "./SubjectPills";
import SenderBlock from "./SenderBlock";
import MessageBody from "./MessageBody";
import AttachmentCard from "./AttachmentCard";
import ReplyComposer from "./ReplyComposer";

export default function ReadingPane({
  message,
  starred,
  onBack,
  onToggleStar,
}: {
  message: MockMessage;
  starred: boolean;
  onBack: () => void;
  onToggleStar: () => void;
}) {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <ReadingTopBar onBack={onBack} starred={starred} onToggleStar={onToggleStar} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-6 pt-5">
          <h1 className="text-[26px] font-semibold text-text-primary leading-tight">
            {message.subject}
          </h1>
        </div>

        <div className="mt-3">
          <SubjectPills
            labels={message.labels}
            encrypted={message.encrypted}
            relayCount={message.relayCount}
          />
        </div>

        <div className="mt-1.5">
          <SenderBlock
            name={message.sender.name}
            npub={message.sender.npub}
            avatarInitials={message.sender.avatarInitials}
            recipientName={message.recipientName}
            verified={message.sender.verified}
            createdAt={message.createdAt}
          />
        </div>

        <div className="mt-1">
          <MessageBody body={message.body} />
        </div>

        {message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 px-6 pt-2 pb-3">
            {message.attachments.map((att) => (
              <AttachmentCard
                key={att.id}
                fileName={att.fileName}
                sizeBytes={att.sizeBytes}
                encrypted={att.encrypted}
                sha256={att.sha256}
                mimeType={att.mimeType}
              />
            ))}
          </div>
        )}
      </div>
      <ReplyComposer recipientName={message.sender.name} />
    </div>
  );
}
