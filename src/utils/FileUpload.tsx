"use client";

import { useRef, useState, useCallback, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { useFileDragState } from "@/hooks/useFileDragState";
import DragDropGlow from "./DragDropGlow";

type AcceptType = "image" | "video" | "both";

interface FileUploadProps {
  /** Single preview URL (single-file mode). */
  imagePreview?: string | null;
  /** Multiple preview URLs (multi-file mode). */
  previews?: string[] | null;
  /** Called in single-file mode when a file is chosen. */
  onFileSelect?: (file: File) => void;
  /** Called in multi-file mode when files are chosen. */
  onFilesSelect?: (files: File[]) => void;
  /** Remove a preview. `index` is provided in multi-file mode. */
  onFileRemove: (index?: number) => void;
  title?: string;
  subtitle?: string;
  maxFiles?: number;
  accept?: AcceptType;
}

const isFileAccepted = (file: File, accept: AcceptType): boolean => {
  if (accept === "both") {
    return file.type.startsWith("image/") || file.type.startsWith("video/");
  }
  return file.type.startsWith(`${accept}/`);
};

const rejectionMessage = (accept: AcceptType): string => {
  if (accept === "video") return "Videos only allowed";
  if (accept === "both") return "Images and videos only";
  return "Images only allowed";
};

const isVideoPreview = (preview: string, accept: AcceptType): boolean => {
  if (accept === "video") return true;
  if (accept === "image") return false;
  return preview.includes("video") || /\.(mp4|webm|ogg|mov)$/i.test(preview);
};

export default function FileUpload({
  imagePreview,
  previews,
  onFileSelect,
  onFilesSelect,
  onFileRemove,
  title = "Upload file",
  subtitle,
  maxFiles = 1,
  accept = "image",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPreviews = previews ?? (imagePreview ? [imagePreview] : []);
  const isMulti = maxFiles > 1;
  const acceptAttr = accept === "both" ? "image/*,video/*" : `${accept}/*`;

  const flashError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  }, []);

  const emitFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const capped = files.slice(0, maxFiles);
      if (onFilesSelect) {
        onFilesSelect(capped);
      } else {
        onFileSelect?.(capped[0]);
      }
    },
    [maxFiles, onFilesSelect, onFileSelect],
  );

  const { isDragging, isInvalid, invalidReason } = useFileDragState(emitFiles, {
    maxFiles,
    accept,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = "";
    if (files.length === 0) return;

    if (!files.every((file) => isFileAccepted(file, accept))) {
      flashError(rejectionMessage(accept));
      return;
    }

    if (files.length > maxFiles) {
      flashError(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`);
      return;
    }

    emitFiles(files);
  };

  const openPicker = () => fileInputRef.current?.click();

  const removeFile = (index: number) => {
    onFileRemove(isMulti ? index : undefined);
  };

  const showPreviews = currentPreviews.length > 0 && !isDragging;

  return (
    <div className="w-full relative">
      <DragDropGlow
        isDragging={isDragging}
        isInvalid={isInvalid}
        invalidReason={invalidReason}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={acceptAttr}
        multiple={isMulti}
        className="hidden"
      />

      {showPreviews ? (
        <div
          className={`grid gap-4 ${isMulti ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}
        >
          {currentPreviews.map((preview, idx) => (
            <div
              key={preview}
              className="relative w-full aspect-video group"
            >
              <div className="w-full h-full rounded-lg overflow-hidden border border-ink-25 relative bg-ink-10">
                {isVideoPreview(preview, accept) ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Upload preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute -top-3 -right-3 z-10 bg-paper text-ink hover:text-rose-gold p-1.5 rounded-full border border-ink-25 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-md"
                aria-label="Remove file"
              >
                <X size={20} />
              </button>
            </div>
          ))}

          {isMulti && currentPreviews.length < maxFiles && (
            <button
              type="button"
              onClick={openPicker}
              className="w-full aspect-video border-2 border-dashed border-rose-gold/50 rounded-lg flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-rose-gold/5 transition-all duration-300"
            >
              <Upload className="text-rose-gold/70" size={24} />
              <div className="font-body font-bold text-ink-60 text-sm">
                Add more
              </div>
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={openPicker}
          className={`w-full aspect-video border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-300 ${
            isDragging
              ? "border-rose-gold bg-rose-gold/10 shadow-[0_0_15px_rgba(184,115,101,0.3)] scale-[1.02]"
              : "border-rose-gold bg-transparent hover:bg-rose-gold/5"
          }`}
        >
          <Upload
            className={`text-rose-gold transition-transform duration-300 ${
              isDragging ? "scale-110" : "group-hover:scale-110"
            }`}
            size={32}
          />
          <div className="font-body font-bold text-ink mt-2">{title}</div>
          {subtitle && (
            <div className="font-body text-xs text-ink-40">{subtitle}</div>
          )}
        </div>
      )}

      {error && (
        <div className="absolute -bottom-6 left-0 text-rust text-sm font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
    </div>
  );
}
