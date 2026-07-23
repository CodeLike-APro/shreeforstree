"use client";
import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";

type AuthMode = "sign-in" | "sign-up";

// Panel slides in from outside the card (easeOut) and exits back through its own edge (easeIn).
// Exit is delayed so the items visibly fade out first, then the panel leaves.
const enterTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };
const exitTransition = {
  duration: 0.4,
  ease: [0.64, 0, 0.78, 0] as const,
  delay: 0.25,
};

const contentVariants: Variants = {
  hidden: {},
  show: {
    // Items fade in after the panel has landed
    transition: { staggerChildren: 0.07, delayChildren: 0.45 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
};

// Items fade in from the edge their panel entered from, and fade out toward
// the edge the panel exits through
const itemVariants: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: 36 * dir }),
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: 36 * dir,
    transition: { duration: 0.2, ease: "easeIn" },
  }),
};

export default function AuthCard({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const isSignIn = mode === "sign-in";

  // Dark panel: left half on sign-in, right half on sign-up.
  // It always enters from / exits through its own outside edge.
  const darkOffscreen = isSignIn ? "-100%" : "100%";
  const darkDir = isSignIn ? -1 : 1;

  // Form panel sits on the opposite half, so it moves in the opposite direction.
  const formOffscreen = isSignIn ? "100%" : "-100%";
  const formDir = isSignIn ? 1 : -1;

  const toggleMode = () => {
    const next: AuthMode = isSignIn ? "sign-up" : "sign-in";
    setMode(next);
    // Shallow URL update — keeps this component mounted so the animation runs uninterrupted
    window.history.pushState(null, "", `/${next}`);
  };

  return (
    <div className="relative w-screen h-screen md:w-auto md:h-auto md:max-w-[50vw] md:min-w-180 md:max-h-[60vh] md:min-h-100 bg-paper drop-shadow-md overflow-hidden">
      {/* Dark panel — desktop only; exits through its own edge, re-enters from the opposite outside edge */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ x: darkOffscreen, opacity: 0 }}
          animate={{ x: "0%", opacity: 1, transition: enterTransition }}
          exit={{ x: darkOffscreen, opacity: 0, transition: exitTransition }}
          className="hidden md:block absolute md:inset-y-0 md:w-1/2 bg-ink"
          style={{
            left: isSignIn ? "0%" : undefined,
            right: isSignIn ? undefined : "0%",
          }}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="h-full w-full flex flex-col items-start justify-center px-6 md:px-10 gap-3 md:gap-4"
          >
            <motion.p
              custom={darkDir}
              variants={itemVariants}
              className="text-rose-gold-dark text-xs font-label uppercase tracking-wide"
            >
              {isSignIn ? "Good to see you again" : "New Here?"}
            </motion.p>
            <motion.div custom={darkDir} variants={itemVariants}>
              <h2 className="text-white text-2xl md:text-4xl font-heading tracking-wide">
                {isSignIn ? "Welcome" : "Join"}
              </h2>
              <h2 className="text-white text-2xl md:text-4xl font-heading tracking-wide">
                {isSignIn ? "Back" : "shreeforstree"}
              </h2>
            </motion.div>
            <motion.p
              custom={darkDir}
              variants={itemVariants}
              className="text-blush text-sm font-label text-start hidden md:block"
            >
              {isSignIn
                ? "Sign in to track your orders, revisit your wishlist, and pick up right where you left off."
                : "Create an account to track orders, save favorites, and enjoy faster checkout."}
            </motion.p>
            <motion.button
              custom={darkDir}
              variants={itemVariants}
              onClick={toggleMode}
              className="bg-ink text-white border border-rose-gold uppercase text-xs px-4 py-2 tracking-wide hover:bg-rose-gold hover:text-ink transition-all duration-300"
            >
              {isSignIn ? "Create an account" : "Sign In Instead"}
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Form panel — opposite half, moves in the opposite direction */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ x: formOffscreen, opacity: 0 }}
          animate={{ x: "0%", opacity: 1, transition: enterTransition }}
          exit={{ x: formOffscreen, opacity: 0, transition: exitTransition }}
          className="absolute inset-x-0 top-0 h-full md:inset-x-auto md:inset-y-0 md:h-auto md:w-1/2 bg-paper"
          style={{
            left: isSignIn ? undefined : "0%",
            right: isSignIn ? "0%" : undefined,
          }}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="h-full w-full flex flex-col items-start justify-center px-6 md:px-10 gap-3 md:gap-4"
          >
            <motion.p
              custom={formDir}
              variants={itemVariants}
              className="text-rose-gold text-xs font-label uppercase tracking-wide"
            >
              {isSignIn ? "Sign In to your account" : "Create a new account"}
            </motion.p>
            <motion.h2
              custom={formDir}
              variants={itemVariants}
              className="text-ink text-xl font-heading"
            >
              {isSignIn ? "Sign In" : "Create Account"}
            </motion.h2>

            <motion.div
              custom={formDir}
              variants={itemVariants}
              className="flex flex-col gap-1 w-full"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="focus:ring-1 focus:ring-ink focus:outline-none rounded-sm border border-ink-40 px-2 h-9 w-full placeholder:text-sm"
              />
              <input
                type="password"
                placeholder="Enter your password"
                className="focus:ring-1 focus:ring-ink focus:outline-none rounded-sm border border-ink-40 px-2 h-9 w-full placeholder:text-sm"
              />
              {isSignIn && (
                <a
                  href="/forgot-password"
                  className="text-rose-gold hover:text-rose-gold-dark hover:underline text-sm font-label tracking-wide w-full text-right"
                >
                  Forgot Password?
                </a>
              )}
            </motion.div>
            <motion.div
              custom={formDir}
              variants={itemVariants}
              className="h-[1.4px] w-full bg-ink-40"
            />
            <motion.button
              custom={formDir}
              variants={itemVariants}
              className="bg-ink text-paper uppercase text-xs px-4 py-2 tracking-wide border rounded-sm border-ink hover:bg-paper hover:text-ink transition-all duration-300 w-full"
            >
              {isSignIn ? "Sign In" : "Create Account"}
            </motion.button>

            <motion.div
              custom={formDir}
              variants={itemVariants}
              className="w-full flex items-center justify-between gap-2"
            >
              <div className="h-[1.4px] w-full bg-ink-25"></div>
              <p className="uppercase text-xs text-ink-40">or</p>
              <div className="h-[1.4px] w-full bg-ink-25"></div>
            </motion.div>
            <motion.button
              custom={formDir}
              variants={itemVariants}
              className="bg-ink text-paper uppercase text-xs px-4 py-2 tracking-wide border rounded-sm border-ink hover:bg-paper hover:text-ink transition-all duration-300 w-full"
            >
              Continue With Google
            </motion.button>

            {/* Mobile-only mode switch — replaces the dark panel's CTA */}
            <motion.p
              custom={formDir}
              variants={itemVariants}
              className="md:hidden w-full text-center text-sm font-label text-ink-40"
            >
              {isSignIn ? "New here? " : "Already have an account? "}
              <button
                onClick={toggleMode}
                className="text-rose-gold hover:text-rose-gold-dark hover:underline uppercase tracking-wide text-xs"
              >
                {isSignIn ? "Create an account" : "Sign In"}
              </button>
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
