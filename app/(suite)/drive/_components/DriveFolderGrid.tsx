"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MenuRoot, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu";
import type { DriveFolder } from "@/lib/types";

interface DriveFolderGridProps {
  folders: DriveFolder[];
  showNewFolderInput: boolean;
  newFolderName: string;
  renameFolderId: string | null;
  renameFolderValue: string;
  onSelectFolder: (id: string | null) => void;
  onNewFolderNameChange: (val: string) => void;
  onNewFolderKeyDown: (e: React.KeyboardEvent) => void;
  onNewFolderCreate: () => void;
  onNewFolderCancel: () => void;
  onShowNewFolder: () => void;
  onRenameFolder: (id: string) => void;
  onRenameValueChange: (val: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onFolderStar: (id: string) => void;
  onFolderTrash: (id: string) => void;
}

export default function DriveFolderGrid({
  folders,
  showNewFolderInput,
  newFolderName,
  renameFolderId,
  renameFolderValue,
  onSelectFolder,
  onNewFolderNameChange,
  onNewFolderKeyDown,
  onNewFolderCreate,
  onNewFolderCancel,
  onShowNewFolder,
  onRenameFolder,
  onRenameValueChange,
  onRenameKeyDown,
  onRenameSubmit,
  onRenameCancel,
  onFolderStar,
  onFolderTrash,
}: DriveFolderGridProps) {
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-text-near-white">Folders</h3>
        <Button variant="ghost" onClick={onShowNewFolder} className="text-brand-light">
          + New Folder
        </Button>
      </div>
      {showNewFolderInput && (
        <div className="mt-3 flex items-center gap-2">
          <input value={newFolderName} onChange={(e) => onNewFolderNameChange(e.target.value)}
            onKeyDown={onNewFolderKeyDown}
            placeholder="Folder name" autoFocus
            className="h-9 flex-1 rounded-pill border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none placeholder:text-text-placeholder" />
          <Button variant="default" onClick={onNewFolderCreate}>Create</Button>
          <Button variant="outline" onClick={onNewFolderCancel}>Cancel</Button>
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {folders.map((folder) => {
          const isRenaming = renameFolderId === folder.id;
          return (
            <div key={folder.id} className="flex h-[108px] flex-col justify-between rounded-pill border border-border bg-sidebar p-4">
              {isRenaming ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={renameFolderValue}
                    onChange={(e) => onRenameValueChange(e.target.value)}
                    onKeyDown={onRenameKeyDown}
                    autoFocus
                    className="h-8 rounded-lg border border-border bg-dock px-3 text-[12px] text-text-primary outline-none"
                  />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onRenameSubmit}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={onRenameCancel} className="text-text-secondary">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <button onClick={() => onSelectFolder(folder.id)} className="flex h-[32px] w-[42px] items-center justify-center rounded-[9px] text-[14px] font-semibold text-white"
                      style={{ backgroundColor: folder.color }}>▰</button>
                    <MenuRoot open={openMenuFolderId === folder.id} onOpenChange={(open) => setOpenMenuFolderId(open ? folder.id : null)}>
                      <MenuTrigger className="inline-flex items-center justify-center text-[16px] text-text-secondary outline-none border-none bg-transparent p-0 cursor-pointer"
                        render={<span />}
                        aria-label="More options"
                        onClick={(e) => { e.stopPropagation(); }}>
                        ⋮
                      </MenuTrigger>
                      <MenuPopup>
                        <MenuItem onClick={() => { onRenameFolder(folder.id); }}>Rename</MenuItem>
                        <MenuItem onClick={() => { onFolderStar(folder.id); }}>{folder.starred ? "Unstar" : "Star"}</MenuItem>
                        <MenuItem onClick={() => { onFolderTrash(folder.id); }}
                          className="text-danger">
                          Trash
                        </MenuItem>
                      </MenuPopup>
                    </MenuRoot>
                  </div>
                  <button onClick={() => onSelectFolder(folder.id)} className="text-left">
                    <p className="text-[13px] font-semibold text-text-near-white">{folder.name}</p>
                    <p className="mt-[4px] text-[10px] text-text-tertiary">{folder.fileCount} files</p>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
