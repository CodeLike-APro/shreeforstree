"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Upload, X } from "lucide-react";
import { useZoneFileDrop } from "@/hooks/useZoneFileDrop";

export interface GalleryItem {
  key: string;
  type: "image" | "video";
  previewUrl: string;
  existing: boolean;
  file?: File;
  url?: string;
  path?: string;
}

interface GalleryManagerProps {
  items: GalleryItem[];
  removed: GalleryItem[];
  onAddFiles: (files: File[]) => void;
  onRemove: (key: string) => void;
  onRestore: (key: string) => void;
  onReorder: (from: number, to: number) => void;
  maxFiles: number;
  disabled?: boolean;
  error?: string;
}

export function ProductGalleryManager({
  items,
  removed,
  onAddFiles,
  onRemove,
  onRestore,
  onReorder,
  maxFiles,
  disabled,
  error,
}: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { isOver, dropHandlers } = useZoneFileDrop(onAddFiles, disabled);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) onAddFiles(files);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, to: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== to) onReorder(dragIndex, to);
    setDragIndex(null);
  };

  const canAdd = items.length < maxFiles;

  return (
    <div className="relative flex flex-col gap-3" {...dropHandlers}>
      {isOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-rose-gold bg-rose-gold/10">
          <span className="rounded-pill bg-paper/90 px-4 py-2 font-label text-xs font-bold uppercase tracking-widest text-rose-gold">
            Drop to add to gallery
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleInput}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.key}
            draggable={!disabled}
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className={`group relative aspect-square overflow-hidden rounded-lg border bg-ink-08 transition-opacity ${
              dragIndex === index ? "border-rose-gold opacity-60" : "border-ink-25"
            } ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
          >
            {item.type === "video" ? (
              <video
                src={item.previewUrl}
                className="h-full w-full object-cover"
                muted
              />
            ) : (
              <img
                src={item.previewUrl}
                alt="Product media"
                className="h-full w-full object-cover"
              />
            )}

            <span className="absolute left-1.5 top-1.5 rounded-pill bg-ink px-2 py-0.5 font-body text-[0.65rem] font-bold text-paper">
              {index === 0 ? "Thumbnail" : index + 1}
            </span>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/50 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => onReorder(index, index - 1)}
                aria-label="Move earlier"
                className="rounded p-1 text-paper disabled:opacity-30"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                disabled={disabled || index === items.length - 1}
                onClick={() => onReorder(index, index + 1)}
                aria-label="Move later"
                className="rounded p-1 text-paper disabled:opacity-30"
              >
                <ArrowRight size={15} />
              </button>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.key)}
              aria-label="Remove media"
              className="absolute right-1.5 top-1.5 rounded-full border border-ink-25 bg-paper p-1 text-ink opacity-0 shadow-sm transition-opacity hover:text-rose-gold group-hover:opacity-100"
            >
              <X size={15} />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rose-gold/60 text-center transition-colors hover:bg-rose-gold/5 disabled:opacity-50"
          >
            <Upload className="text-rose-gold" size={22} />
            <span className="font-body text-xs font-bold text-ink-55">
              Add media
            </span>
          </button>
        )}
      </div>

      {error && <p className="font-body text-xs text-rust">{error}</p>}

      <p className="font-body text-xs text-ink-40">
        Drag to reorder. The first item is the thumbnail. Up to {maxFiles} files,
        at least one image.
      </p>

      {removed.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-ink-15 bg-ink-05 p-3">
          <span className="font-body text-xs font-bold text-ink-55">
            Marked for removal (saved changes will delete these)
          </span>
          <div className="flex flex-wrap gap-3">
            {removed.map((item) => (
              <div
                key={item.key}
                className="relative h-16 w-16 overflow-hidden rounded-md border border-ink-25"
              >
                {item.type === "video" ? (
                  <video
                    src={item.previewUrl}
                    className="h-full w-full object-cover opacity-50"
                    muted
                  />
                ) : (
                  <img
                    src={item.previewUrl}
                    alt="Removed media"
                    className="h-full w-full object-cover opacity-50"
                  />
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRestore(item.key)}
                  aria-label="Restore media"
                  className="absolute inset-0 flex items-center justify-center bg-ink/30 text-paper"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface HeroSlotProps {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  hasPending: boolean;
  disabled?: boolean;
}

export function HeroImageSlot({
  previewUrl,
  onSelect,
  onClear,
  hasPending,
  disabled,
}: HeroSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isOver, dropHandlers } = useZoneFileDrop((files) => {
    const image = files.find((f) => f.type.startsWith("image/"));
    if (image) onSelect(image);
  }, disabled);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelect(file);
  };

  return (
    <div className="relative flex flex-col gap-3" {...dropHandlers}>
      {isOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-rose-gold bg-rose-gold/10">
          <span className="rounded-pill bg-paper/90 px-4 py-2 font-label text-xs font-bold uppercase tracking-widest text-rose-gold">
            Drop to set hero
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInput}
        className="hidden"
      />
      {previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-ink-25 bg-ink-08">
          <img
            src={previewUrl}
            alt="Hero"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-ink/40 p-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-paper px-3 py-1 font-body text-xs font-bold text-ink hover:bg-blush"
            >
              Replace
            </button>
            {hasPending && (
              <button
                type="button"
                disabled={disabled}
                onClick={onClear}
                className="rounded-md border border-paper/60 px-3 py-1 font-body text-xs font-bold text-paper"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rose-gold/60 text-center transition-colors hover:bg-rose-gold/5 disabled:opacity-50"
        >
          <Upload className="text-rose-gold" size={26} />
          <span className="font-body text-sm font-bold text-ink">
            Upload hero image
          </span>
          <span className="font-body text-xs text-ink-40">
            Shown on the storefront banner
          </span>
        </button>
      )}
    </div>
  );
}
