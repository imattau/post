"use client";

import { useCallback, useMemo } from "react";
import type { MockMessage } from "@/lib/mock/threads";
import type { Message, Profile } from "@post/nostr-core";
import ReadingTopBar from "./ReadingTopBar";
import SubjectPills from "./SubjectPills";
import SenderBlock from "./SenderBlock";
import MessageBody from "./MessageBody";
import AttachmentCard from "./AttachmentCard";
import ReplyComposer from "./ReplyComposer";
import ThreadView from "./ThreadView";
import { useSettingsStore } from "@/lib/stores/settings";
import { useProfilesStore } from "@/lib/stores/profiles";

function senderName(pubkey: string, profiles: Record<string, Profile>): string {
  const profile = profiles[pubkey];
  if (profile?.name) return profile.name;
  if (profile?.displayName) return profile.displayName;
  return `${pubkey.slice(0, 12)}…`;
}

function senderInitials(pubkey: string, profiles: Record<string, Profile>): string {
  const profile = profiles[pubkey];
  if (profile?.name) return profile.name.slice(0, 2).toUpperCase();
  if (profile?.displayName) return profile.displayName.slice(0, 2).toUpperCase();
  return pubkey.slice(0, 2).toUpperCase();
}

function formatNpub(pubkey: string): string {
  return `npub1${pubkey.slice(0, 8)}…${pubkey.slice(-4)}`;
}

export default function ReadingPane({
  message,
  starred,
  spam,
  archived,
  onBack,
  onToggleStar,
  onArchive,
  onSnooze,
  onDelete,
  onToggleRead,
  onToggleSpam,
  onCopyEventId,
  onReplyAll,
  onForward,
  threadMessages,
  onThreadSelect,
  conversationView,
  allThreadMessages,
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
  onReplyAll: () => void;
  onForward: () => void;
  archived: boolean;
  threadMessages?: Message[];
  onThreadSelect?: (id: string) => void;
  conversationView?: boolean;
  allThreadMessages?: Message[];
}) {
  const stableOnThreadSelect = useCallback(
    (id: string) => onThreadSelect?.(id),
    [onThreadSelect]
  );

  const showImagesInline = (useSettingsStore((s) => s.values["show-images-inline"]) ?? true) as boolean;
  const profiles = useProfilesStore((s) => s.byPubkey);

  const isConversationView = conversationView && allThreadMessages && allThreadMessages.length > 1;

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
        onReplyAll={onReplyAll}
        onForward={onForward}
        read={message.read}
        spam={spam}
        archived={archived}
        messageId={message.id}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-10 pt-[30px]">
        {isConversationView ? (
          <div>
            {allThreadMessages.map((msg, i) => {
              const isSelected = msg.id === message.id;
              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`${i > 0 ? "border-t border-border pt-10 mt-10" : ""} ${
                    isSelected ? "ring-1 ring-brand/30 rounded-[14px] -mx-4 px-4 pt-6 pb-4" : ""
                  }`}
                >
                  <SenderBlock
                    name={senderName(msg.pubkey, profiles)}
                    npub={formatNpub(msg.pubkey)}
                    avatarInitials={senderInitials(msg.pubkey, profiles)}
                    recipientName={msg.pubkey === message.sender.id ? message.recipientName : "me"}
                    verified={false}
                    createdAt={msg.createdAt}
                  />
                  <div className="mt-[20px]">
                    <SubjectPills
                      labels={[]}
                      encrypted={msg.isEncrypted ?? true}
                      isGiftWrapped={msg.isGiftWrapped}
                      relayCount={msg.relayUrls?.length ?? 3}
                    />
                  </div>
                  <div className="mt-[16px]">
                    <MessageBody body={msg.content} />
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && showImagesInline && (
                    <div className="flex flex-wrap gap-3 pt-8 pb-3">
                      {msg.attachments.map((att) => (
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
                          messageId={msg.id}
                        />
                      ))}
                    </div>
                  )}
                  {msg.attachments && msg.attachments.length > 0 && !showImagesInline && (
                    <div className="pt-8 pb-3 space-y-1">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 text-[12px] text-text-secondary">
                          <span>📎</span>
                          <span>{att.fileName}</span>
                          <span className="text-text-tertiary">({(att.sizeBytes / 1024).toFixed(0)} KB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <ThreadView
              messages={threadMessages ?? []}
              onSelect={stableOnThreadSelect}
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

            {message.attachments.length > 0 && showImagesInline && (
              <div className="flex flex-wrap gap-3 pt-8 pb-3">
                {message.attachments.map((att) => (
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
                    messageId={message.id}
                  />
                ))}
              </div>
            )}
            {message.attachments.length > 0 && !showImagesInline && (
              <div className="pt-8 pb-3 space-y-1">
                {message.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 text-[12px] text-text-secondary">
                    <span>📎</span>
                    <span>{att.fileName}</span>
                    <span className="text-text-tertiary">({(att.sizeBytes / 1024).toFixed(0)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <ReplyComposer
        recipientName={message.sender.name}
        recipientPubkey={message.sender.id}
        recipientNpub={message.sender.npub}
        messageId={message.id}
        subject={message.subject}
        messageBody={message.body}
      />
    </div>
  );
}
