"use client";

import { useRef, useState, useCallback, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { useFileDragState } from "@/hooks/useFileDragState";
import dynamic from "next/dynamic";

const DragDropGlow = dynamic(() => import("./DragDropGlow"), { ssr: false });

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
    <div className="relative w-full">
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
            <div key={preview} className="group relative aspect-video w-full">
              <div className="border-ink-25 bg-ink-10 relative h-full w-full overflow-hidden rounded-lg border">
                {isVideoPreview(preview, accept) ? (
                  <video
                    src={preview}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Upload preview"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="bg-ink/40 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="bg-paper text-ink hover:text-rose-gold border-ink-25 absolute -top-3 -right-3 z-10 scale-75 rounded-full border p-1.5 opacity-0 shadow-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
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
              className="border-rose-gold/50 hover:bg-rose-gold/5 flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-all duration-300"
            >
              <Upload className="text-rose-gold/70" size={24} />
              <div className="font-body text-ink-60 text-sm font-bold">
                Add more
              </div>
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={openPicker}
          className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300 ${
            isDragging
              ? "border-rose-gold bg-rose-gold/10 scale-[1.02] shadow-[0_0_15px_rgba(184,115,101,0.3)]"
              : "border-rose-gold hover:bg-rose-gold/5 bg-transparent"
          }`}
        >
          <Upload
            className={`text-rose-gold transition-transform duration-300 ${
              isDragging ? "scale-110" : "group-hover:scale-110"
            }`}
            size={32}
          />
          <div className="font-body text-ink mt-2 font-bold">{title}</div>
          {subtitle && (
            <div className="font-body text-ink-40 text-xs">{subtitle}</div>
          )}
        </div>
      )}

      {error && (
        <div className="text-rust animate-in fade-in slide-in-from-top-1 absolute -bottom-6 left-0 text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
