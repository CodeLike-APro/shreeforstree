import { useEffect, useRef, useState } from "react";

type AcceptType = "image" | "video" | "both";

export interface DragStateOptions {
  maxFiles?: number;
  accept?: AcceptType;
}

export interface FileDragState {
  isDragging: boolean;
  isInvalid: boolean;
  invalidReason: string | null;
}

const isFileAccepted = (file: File, accept: AcceptType): boolean => {
  if (accept === "both") {
    return file.type.startsWith("image/") || file.type.startsWith("video/");
  }
  return file.type.startsWith(`${accept}/`);
};

export function useFileDragState(
  onDrop?: (files: File[]) => void,
  options?: DragStateOptions,
): FileDragState {
  const [isDragging, setIsDragging] = useState(false);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const dragDepth = useRef(0);

  const maxFiles = options?.maxFiles;
  const accept: AcceptType = options?.accept ?? "image";

  // Keep the latest callback without re-binding window listeners on every render.
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const flashInvalid = (reason: string) => {
      setInvalidReason(reason);
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setInvalidReason(null), 2000);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer?.types.includes("Files")) return;

      dragDepth.current += 1;
      if (dragDepth.current === 1) {
        setIsDragging(true);
        setInvalidReason(null);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer?.types.includes("Files")) return;

      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;

      if (!files.every((file) => isFileAccepted(file, accept))) {
        flashInvalid(
          accept === "video"
            ? "Videos only"
            : accept === "both"
              ? "Media only"
              : "Images only",
        );
        return;
      }

      if (maxFiles !== undefined && files.length > maxFiles) {
        flashInvalid(`Max ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`);
        return;
      }

      setInvalidReason(null);
      onDropRef.current?.(files);
    };

    const resetDrag = () => {
      dragDepth.current = 0;
      setIsDragging(false);
      setInvalidReason(null);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("blur", resetDrag);

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("blur", resetDrag);
    };
  }, [maxFiles, accept]);

  return { isDragging, isInvalid: invalidReason !== null, invalidReason };
}
