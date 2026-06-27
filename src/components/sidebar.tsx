"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedDTO, FolderDTO } from "@/lib/api-client";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  InboxIcon,
  PlusIcon,
  RssIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
  DownloadIcon,
  RefreshIcon,
} from "./icons";

export type Selection =
  | { kind: "all" }
  | { kind: "starred" }
  | { kind: "feed"; id: number }
  | { kind: "folder"; id: number };

type Props = {
  feeds: FeedDTO[];
  folders: FolderDTO[];
  totalUnread: number;
  starredCount: number;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onAddFeed: () => void;
  onImportOpml: () => void;
  onCreateFolder: () => void;
  onRemoveFeed: (id: number, title: string) => void;
  onRemoveFolder: (id: number, name: string) => void;
  onAssignFolder: (feedId: number, folderId: number | null) => void;
  onRefreshAll: () => void;
  refreshing: boolean;
};

function isSelected(s: Selection, target: Selection): boolean {
  if (s.kind !== target.kind) return false;
  if (s.kind === "feed" && target.kind === "feed") return s.id === target.id;
  if (s.kind === "folder" && target.kind === "folder") return s.id === target.id;
  return true;
}

export function Sidebar({
  feeds,
  folders,
  totalUnread,
  starredCount,
  selection,
  onSelect,
  onAddFeed,
  onImportOpml,
  onCreateFolder,
  onRemoveFeed,
  onRemoveFolder,
  onAssignFolder,
  onRefreshAll,
  refreshing,
}: Props) {
  const [openFolders, setOpenFolders] = useState<Set<number>>(
    () => new Set(folders.map((f) => f.id)),
  );

  function toggleFolder(id: number) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const unfiledFeeds = feeds.filter((f) => f.folderId == null);

  return (
    <nav
      className="flex h-full flex-col bg-(--surface) border-r border-(--border) text-sm"
      aria-label="Feeds and folders"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border)">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/logo.png"
            alt=""
            width={22}
            height={22}
            className="rounded-sm"
          />
          <span>RSS Reader</span>
        </div>
        <button
          type="button"
          onClick={onRefreshAll}
          disabled={refreshing}
          className="p-1.5 rounded hover:bg-(--surface-2) disabled:opacity-50"
          aria-label="Refresh all feeds"
          title="Refresh all feeds"
        >
          <RefreshIcon
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      <ul className="px-2 py-2 space-y-0.5" aria-label="Smart views">
        <li>
          <SidebarItem
            icon={<InboxIcon size={16} />}
            label="All articles"
            count={totalUnread}
            selected={isSelected(selection, { kind: "all" })}
            onClick={() => onSelect({ kind: "all" })}
          />
        </li>
        <li>
          <SidebarItem
            icon={<StarIcon size={16} />}
            label="Starred"
            count={starredCount}
            selected={isSelected(selection, { kind: "starred" })}
            onClick={() => onSelect({ kind: "starred" })}
          />
        </li>
      </ul>

      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--muted)">
          Subscriptions
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onCreateFolder}
            className="min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2)"
            aria-label="New folder"
            title="New folder"
          >
            <FolderIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onImportOpml}
            className="min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2)"
            aria-label="Import OPML"
            title="Import OPML"
          >
            <UploadIcon size={14} />
          </button>
          <a
            href="/api/opml/export"
            className="min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2)"
            aria-label="Export OPML"
            title="Export OPML"
          >
            <DownloadIcon size={14} />
          </a>
          <button
            type="button"
            onClick={onAddFeed}
            className="min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2)"
            aria-label="Add feed"
            title="Add feed"
          >
            <PlusIcon size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        <ul className="space-y-0.5">
          {folders.map((folder) => {
            const folderFeeds = feeds.filter((f) => f.folderId === folder.id);
            const folderUnread = folderFeeds.reduce(
              (s, f) => s + f.unreadCount,
              0,
            );
            const isOpen = openFolders.has(folder.id);
            const selectedFolder = isSelected(selection, {
              kind: "folder",
              id: folder.id,
            });
            const sublistId = `folder-${folder.id}-feeds`;
            return (
              <li key={folder.id}>
                <div className="flex items-center group">
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    className="min-w-6 min-h-6 inline-flex items-center justify-center p-1 rounded hover:bg-(--surface-2)"
                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${folder.name}`}
                    aria-expanded={isOpen}
                    aria-controls={sublistId}
                  >
                    {isOpen ? (
                      <ChevronDownIcon size={12} />
                    ) : (
                      <ChevronRightIcon size={12} />
                    )}
                  </button>
                  <SidebarItem
                    icon={
                      isOpen ? (
                        <FolderOpenIcon size={16} />
                      ) : (
                        <FolderIcon size={16} />
                      )
                    }
                    label={folder.name}
                    count={folderUnread}
                    selected={selectedFolder}
                    onClick={() =>
                      onSelect({ kind: "folder", id: folder.id })
                    }
                    onDelete={() => onRemoveFolder(folder.id, folder.name)}
                  />
                </div>
                <ul
                  id={sublistId}
                  hidden={!isOpen || folderFeeds.length === 0}
                  className="ml-5 space-y-0.5 mt-0.5"
                >
                  {folderFeeds.map((feed) => (
                    <FeedRow
                      key={feed.id}
                      feed={feed}
                      folders={folders}
                      selected={isSelected(selection, {
                        kind: "feed",
                        id: feed.id,
                      })}
                      onSelect={() => onSelect({ kind: "feed", id: feed.id })}
                      onRemove={() => onRemoveFeed(feed.id, feed.title)}
                      onAssign={(folderId) => onAssignFolder(feed.id, folderId)}
                    />
                  ))}
                </ul>
              </li>
            );
          })}

          {unfiledFeeds.length > 0 && (
            <li className="mt-2">
              {folders.length > 0 && (
                <h3 className="px-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-(--muted)">
                  Unfiled
                </h3>
              )}
              <ul className="space-y-0.5">
                {unfiledFeeds.map((feed) => (
                  <FeedRow
                    key={feed.id}
                    feed={feed}
                    folders={folders}
                    selected={isSelected(selection, {
                      kind: "feed",
                      id: feed.id,
                    })}
                    onSelect={() => onSelect({ kind: "feed", id: feed.id })}
                    onRemove={() => onRemoveFeed(feed.id, feed.title)}
                    onAssign={(folderId) =>
                      onAssignFolder(feed.id, folderId)
                    }
                  />
                ))}
              </ul>
            </li>
          )}

          {feeds.length === 0 && (
            <li className="px-3 py-6 text-center text-(--muted) text-xs">
              No feeds yet. Use the Add feed button to subscribe.
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

function SidebarItem({
  icon,
  label,
  count,
  selected,
  onClick,
  onDelete,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`group flex flex-1 items-center gap-2 rounded px-2 py-1.5 ${
        selected
          ? "bg-(--selected) text-(--selected-fg)"
          : "hover:bg-(--surface-2)"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center gap-2 text-left min-w-0"
        aria-current={selected ? "true" : undefined}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {count != null && count > 0 && (
          <span
            className={`shrink-0 text-xs tabular-nums ${
              selected ? "" : "text-(--muted)"
            }`}
            aria-label={`${count} unread`}
          >
            {count}
          </span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 min-w-6 min-h-6 inline-flex items-center justify-center p-0.5 rounded hover:bg-(--surface)"
          aria-label="Delete"
        >
          <TrashIcon size={12} />
        </button>
      )}
    </div>
  );
}

function FeedRow({
  feed,
  folders,
  selected,
  onSelect,
  onRemove,
  onAssign,
}: {
  feed: FeedDTO;
  folders: FolderDTO[];
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onAssign: (folderId: number | null) => void;
}) {
  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded px-2 py-1.5 ${
          selected
            ? "bg-(--selected) text-(--selected-fg)"
            : "hover:bg-(--surface-2)"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
          aria-current={selected ? "page" : undefined}
          title={feed.title}
        >
          <span className="shrink-0 w-4 h-4 flex items-center justify-center text-(--muted)">
            {feed.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={feed.iconUrl}
                alt=""
                width={14}
                height={14}
                className="rounded-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <RssIcon size={12} />
            )}
          </span>
          <span className="flex-1 truncate">{feed.title}</span>
          {feed.lastError && (
            <span
              className="shrink-0 w-1.5 h-1.5 rounded-full bg-(--danger)"
              aria-label={`Last fetch error: ${feed.lastError}`}
              title={`Error: ${feed.lastError}`}
            />
          )}
          {feed.unreadCount > 0 && (
            <span
              className={`shrink-0 text-xs tabular-nums ${
                selected ? "" : "text-(--muted)"
              }`}
              aria-label={`${feed.unreadCount} unread`}
            >
              {feed.unreadCount}
            </span>
          )}
        </button>
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center gap-0.5">
          {folders.length > 0 && (
            <select
              value={feed.folderId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onAssign(v === "" ? null : Number(v));
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs bg-transparent rounded p-0.5 min-h-6 max-w-[6rem]"
              aria-label={`Folder for ${feed.title}`}
            >
              <option value="">Unfiled</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="min-w-6 min-h-6 inline-flex items-center justify-center p-0.5 rounded hover:bg-(--surface)"
            aria-label={`Unsubscribe from ${feed.title}`}
          >
            <TrashIcon size={12} />
          </button>
        </div>
      </div>
    </li>
  );
}
