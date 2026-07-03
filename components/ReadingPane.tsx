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
  onArchive,
  onSnooze,
  onDelete,
}: {
  message: MockMessage;
  starred: boolean;
  onBack: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onSnooze: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <ReadingTopBar
        onBack={onBack}
        starred={starred}
        onToggleStar={onToggleStar}
        onArchive={onArchive}
        onSnooze={onSnooze}
        onDelete={onDelete}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-10 pt-[30px]">
        <div>
          <h1 className="max-w-[560px] text-[25px] font-semibold leading-tight text-text-near-white">
            {message.subject}
          </h1>
        </div>

        <div className="mt-[13px]">
          <SubjectPills
            labels={message.labels}
            encrypted={message.encrypted}
            relayCount={message.relayCount}
          />
        </div>

        <div className="mt-[22px]">
          <SenderBlock
            name={message.sender.name}
            npub={message.sender.npub}
            avatarInitials={message.sender.avatarInitials}
            recipientName={message.recipientName}
            verified={message.sender.verified}
            createdAt={message.createdAt}
          />
        </div>

        <div className="mt-[24px]">
          <MessageBody body={message.body} />
        </div>

        {message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-8 pb-3">
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
      <ReplyComposer
        recipientName={message.sender.name}
        recipientPubkey={message.sender.id}
        recipientNpub={message.sender.npub}
        messageId={message.id}
        subject={message.subject}
      />
    </div>
  );
}
