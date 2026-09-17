"use client";

import { ArrowLeft, ArrowRight, RotateCcw, Upload, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
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
        <div className="border-rose-gold bg-rose-gold/10 pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed">
          <span className="rounded-pill bg-paper/90 font-label text-rose-gold px-4 py-2 text-xs font-bold tracking-widest uppercase">
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
            className={`group bg-ink-08 relative aspect-square overflow-hidden rounded-lg border transition-opacity ${
              dragIndex === index
                ? "border-rose-gold opacity-60"
                : "border-ink-25"
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

            <span className="rounded-pill bg-ink font-body text-paper absolute top-1.5 left-1.5 px-2 py-0.5 text-[0.65rem] font-bold">
              {index === 0 ? "Thumbnail" : index + 1}
            </span>

            <div className="bg-ink/50 absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => onReorder(index, index - 1)}
                aria-label="Move earlier"
                className="text-paper rounded p-1 disabled:opacity-30"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                disabled={disabled || index === items.length - 1}
                onClick={() => onReorder(index, index + 1)}
                aria-label="Move later"
                className="text-paper rounded p-1 disabled:opacity-30"
              >
                <ArrowRight size={15} />
              </button>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.key)}
              aria-label="Remove media"
              className="border-ink-25 bg-paper text-ink hover:text-rose-gold absolute top-1.5 right-1.5 rounded-full border p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
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
            className="border-rose-gold/60 hover:bg-rose-gold/5 flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors disabled:opacity-50"
          >
            <Upload className="text-rose-gold" size={22} />
            <span className="font-body text-ink-55 text-xs font-bold">
              Add media
            </span>
          </button>
        )}
      </div>

      {error && <p className="font-body text-rust text-xs">{error}</p>}

      <p className="font-body text-ink-40 text-xs">
        Drag to reorder. The first item is the thumbnail. Up to {maxFiles}{" "}
        files, at least one image.
      </p>

      {removed.length > 0 && (
        <div className="border-ink-15 bg-ink-05 flex flex-col gap-2 rounded-lg border p-3">
          <span className="font-body text-ink-55 text-xs font-bold">
            Marked for removal (saved changes will delete these)
          </span>
          <div className="flex flex-wrap gap-3">
            {removed.map((item) => (
              <div
                key={item.key}
                className="border-ink-25 relative h-16 w-16 overflow-hidden rounded-md border"
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
                  className="bg-ink/30 text-paper absolute inset-0 flex items-center justify-center"
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
        <div className="border-rose-gold bg-rose-gold/10 pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed">
          <span className="rounded-pill bg-paper/90 font-label text-rose-gold px-4 py-2 text-xs font-bold tracking-widest uppercase">
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
        <div className="border-ink-25 bg-ink-08 relative aspect-video w-full overflow-hidden rounded-lg border">
          <img
            src={previewUrl}
            alt="Hero"
            className="h-full w-full object-cover"
          />
          <div className="bg-ink/40 absolute inset-x-0 bottom-0 flex justify-end gap-2 p-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="bg-paper font-body text-ink hover:bg-blush rounded-md px-3 py-1 text-xs font-bold"
            >
              Replace
            </button>
            {hasPending && (
              <button
                type="button"
                disabled={disabled}
                onClick={onClear}
                className="border-paper/60 font-body text-paper rounded-md border px-3 py-1 text-xs font-bold"
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
          className="border-rose-gold/60 hover:bg-rose-gold/5 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors disabled:opacity-50"
        >
          <Upload className="text-rose-gold" size={26} />
          <span className="font-body text-ink text-sm font-bold">
            Upload hero image
          </span>
          <span className="font-body text-ink-40 text-xs">
            Shown on the storefront banner
          </span>
        </button>
      )}
    </div>
  );
}
