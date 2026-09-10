"use client";

import { motion, useReducedMotion } from "motion/react";

export default function SuccessMark() {
  const prefersReducedMotion = useReducedMotion() === true;
  return (
    <motion.span
      initial={
        prefersReducedMotion
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.86 }
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              type: "spring",
              damping: 26,
              stiffness: 240,
              mass: 0.8,
            }
      }
      className="bg-sage/15 ring-sage/30 flex size-12 items-center justify-center rounded-full ring-1"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-sage size-5"
        aria-hidden
      >
        <motion.path
          d="M4 12.5 9.5 18 20 7"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.5, delay: 0.18, ease: "easeOut" }
          }
        />
      </svg>
    </motion.span>
  );
}
