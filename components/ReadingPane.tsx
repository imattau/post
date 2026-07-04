"use client";

import type { MockMessage } from "@/lib/mock/threads";
import type { Message, Profile } from "@post/nostr-core";
import { useDriveStore } from "@/lib/stores/drive";
import { useProfilesStore } from "@/lib/stores/profiles";
import ReadingTopBar from "./ReadingTopBar";
import SubjectPills from "./SubjectPills";
import SenderBlock from "./SenderBlock";
import MessageBody from "./MessageBody";
import AttachmentCard from "./AttachmentCard";
import ReplyComposer from "./ReplyComposer";
import ThreadView from "./ThreadView";

export default function ReadingPane({
  message,
  starred,
  spam,
  onBack,
  onToggleStar,
  onArchive,
  onSnooze,
  onDelete,
  onToggleRead,
  onToggleSpam,
  onCopyEventId,
  threadMessages,
  onThreadSelect,
}: {
  message: MockMessage;
  starred: boolean;
  spam: boolean;
  onBack: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onSnooze: () => void;
  onDelete: () => void;
  onToggleRead: () => void;
  onToggleSpam: () => void;
  onCopyEventId: () => void;
  threadMessages?: Message[];
  onThreadSelect?: (id: string) => void;
}) {
  const driveFiles = useDriveStore((s) => s.files);
  const importAttachment = useDriveStore((s) => s.importAttachment);
  const profiles = useProfilesStore((s) => s.byPubkey);
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <ReadingTopBar
        onBack={onBack}
        starred={starred}
        onToggleStar={onToggleStar}
        onArchive={onArchive}
        onSnooze={onSnooze}
        onDelete={onDelete}
        onToggleRead={onToggleRead}
        onToggleSpam={onToggleSpam}
        onCopyEventId={onCopyEventId}
        read={message.read}
        spam={spam}
        messageId={message.id}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-10 pt-[30px]">
        <ThreadView
          messages={threadMessages ?? []}
          onSelect={onThreadSelect ?? (() => {})}
          profiles={profiles}
        />
        <div>
          <h1 className="max-w-[560px] text-[26px] font-semibold leading-tight text-text-near-white">
            {message.subject}
          </h1>
        </div>

        <div className="mt-[13px]">
          <SubjectPills
            labels={message.labels}
            encrypted={message.encrypted}
            isGiftWrapped={message.isGiftWrapped}
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
            {message.attachments.map((att) => {
              const inDrive = driveFiles.some((f) => f.sha256 === att.sha256);
              return (
                <AttachmentCard
                  key={att.id}
                  fileName={att.fileName}
                  sizeBytes={att.sizeBytes}
                  encrypted={att.encrypted}
                  sha256={att.sha256}
                  mimeType={att.mimeType}
                  url={att.url}
                  fileKey={att.fileKey}
                  fileIv={att.fileIv}
                  storedInDrive={inDrive}
                  onSaveToDrive={inDrive ? undefined : () => importAttachment({ fileName: att.fileName, mimeType: att.mimeType, sizeBytes: att.sizeBytes, sha256: att.sha256, url: att.url, encrypted: att.encrypted }, message.id)}
                />
              );
            })}
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
