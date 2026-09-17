"use client";

import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";

interface DragDropGlowProps {
  isDragging: boolean;
  isInvalid: boolean;
  invalidReason?: string | null;
}

export default function DragDropGlow({
  isDragging,
  isInvalid,
  invalidReason,
}: DragDropGlowProps) {
  return createPortal(
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-9999 will-change-transform"
          aria-live="polite"
          role="status"
        >
          {/* Subtle backdrop dim */}
          <div className="bg-ink-08 absolute inset-0" />

          {/* 
            Glow implementation: Blob Approach
            Creates distinct large blurred radial gradients at the edges,
            with a center mask to ensure 120-180px falloff.
          */}
          <motion.div
            initial={{ scale: 1.03 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0"
            style={{
              maskImage:
                "radial-gradient(ellipse at center, transparent 0%, transparent 60%, black 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, transparent 0%, transparent 60%, black 100%)",
            }}
          >
            <div className="animate-glow-breathe absolute inset-[-50%]">
              <div
                className="animate-glow-spin absolute inset-0 opacity-80 blur-[50px]"
                style={{
                  background: `conic-gradient(from var(--glow-angle), var(--color-rose-gold), var(--color-blush), var(--color-rose-gold))`,
                }}
              />
            </div>
          </motion.div>

          {/* Centered Pill */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={
                isInvalid
                  ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } }
                  : {
                      opacity: 1,
                      y: 0,
                      transition: { delay: 0.08, duration: 0.2 },
                    }
              }
              className={`shadow-card rounded-full border px-6 py-3 backdrop-blur-md ${isInvalid ? "bg-rust/10 border-rust text-rust" : "bg-paper/80 border-rose-gold/20 text-ink"} `}
            >
              <span className="font-label text-sm font-bold tracking-widest uppercase">
                {isInvalid
                  ? invalidReason || "Invalid files"
                  : "Drop files here"}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
