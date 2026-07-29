"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] pointer-events-none will-change-transform"
          aria-live="polite"
          role="status"
        >
          {/* Subtle backdrop dim */}
          <div className="absolute inset-0 bg-ink-08" />

          {/* 
            Glow implementation: Blob Approach
            Creates distinct large blurred radial gradients at the edges,
            with a center mask to ensure 120-180px falloff.
          */}
          <motion.div
            initial={{ scale: 1.03 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{
              maskImage: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, black 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, black 100%)',
            }}
          >
            <div className="absolute inset-[-50%] animate-glow-breathe">
              <div
                className="absolute inset-0 animate-glow-spin opacity-80 blur-[50px]"
                style={{
                  background: `conic-gradient(from var(--glow-angle), var(--color-rose-gold), var(--color-blush), var(--color-rose-gold))`
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
              className={`
                px-6 py-3 rounded-full backdrop-blur-md border shadow-card
                ${isInvalid ? "bg-[var(--color-rust)]/10 border-[var(--color-rust)] text-[var(--color-rust)]" : "bg-paper/80 border-rose-gold/20 text-ink"}
              `}
            >
              <span className="font-label uppercase tracking-widest font-bold text-sm">
                {isInvalid ? (invalidReason || "Invalid files") : "Drop files here"}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}


