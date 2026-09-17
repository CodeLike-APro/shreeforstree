import { type DragEvent, useCallback, useRef, useState } from "react";

const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes("Files");

export function useZoneFileDrop(
  onFiles: (files: File[]) => void,
  disabled?: boolean,
) {
  const [isOver, setIsOver] = useState(false);
  const depth = useRef(0);

  const onDragEnter = useCallback(
    (e: DragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setIsOver(true);
    },
    [disabled],
  );

  const onDragOver = useCallback(
    (e: DragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [disabled],
  );

  const onDragLeave = useCallback(
    (e: DragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      depth.current -= 1;
      if (depth.current <= 0) {
        depth.current = 0;
        setIsOver(false);
      }
    },
    [disabled],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setIsOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [disabled, onFiles],
  );

  return {
    isOver,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
