"use client";
import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  type Variants,
} from "motion/react";
import { LoaderIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";
type FieldKey = "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldKey | "form", string>>;

const enterTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };
const exitTransition = {
  duration: 0.4,
  ease: [0.64, 0, 0.78, 0] as const,
  delay: 0.25,
};

const contentVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.45 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
};

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

// Damped horizontal shake played on a field when it errors
const shakeKeyframes = {
  x: [0, -8, 8, -6, 6, -3, 3, 0],
  transition: { duration: 0.45, ease: "easeInOut" as const },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Resolve where to send the user after auth, from the `?redirect=` param.
// Only same-origin, root-relative paths are allowed — everything else falls
// back to "/" so a crafted link can't bounce users to a phishing site.
function getSafeRedirect(): string {
  const fallback = "/";
  const target = new URLSearchParams(window.location.search)
    .get("redirect")
    ?.trim();

  // Must be root-relative. Reject absolute URLs and protocol-relative
  // ("//evil.com") or backslash ("/\evil.com") variants that resolve off-site.
  if (!target || !target.startsWith("/") || /^[/\\]{2}|^\/\\/.test(target)) {
    return fallback;
  }

  try {
    // Resolve against our own origin and confirm it never left it. The URL
    // parser normalizes backslashes for http(s), so this catches the rest.
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    // Never send users back to the auth pages themselves.
    if (url.pathname === "/sign-in" || url.pathname === "/sign-up") {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

const inputBase =
  "focus:outline-none focus:ring-1 rounded-sm border px-2 h-9 w-full placeholder:text-sm transition-colors duration-300";
const inputOk = "border-ink-40 focus:ring-ink";
const inputErr = "border-red-500 focus:ring-red-500 bg-red-500/[0.03]";

// Inline error message that smoothly expands/collapses below a field
function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden text-red-600 text-xs font-label leading-snug"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function AuthCard({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const isSignIn = mode === "sign-in";
  const darkOffscreen = isSignIn ? "-100%" : "100%";
  const darkDir = isSignIn ? -1 : 1;
  const formOffscreen = isSignIn ? "100%" : "-100%";
  const formDir = isSignIn ? 1 : -1;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const emailShake = useAnimationControls();
  const passwordShake = useAnimationControls();
  const confirmShake = useAnimationControls();

  const shakeFields = (fields: FieldErrors) => {
    if ("email" in fields) emailShake.start(shakeKeyframes);
    if ("password" in fields) passwordShake.start(shakeKeyframes);
    if ("confirmPassword" in fields) confirmShake.start(shakeKeyframes);
  };

  // Clear a field's error as the user corrects it
  const clearError = (field: FieldKey) =>
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      delete next.form;
      return next;
    });

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";
    else if (!isSignIn && password.length < 8)
      next.password = "Password must be at least 8 characters.";

    if (!isSignIn && confirmPassword !== password)
      next.confirmPassword = "Passwords do not match.";

    return next;
  };

  // Map a Better Auth error to the field(s) it belongs to
  const mapServerError = (code?: string, message?: string): FieldErrors => {
    const msg = message || "Something went wrong. Please try again.";
    switch (code) {
      case "INVALID_EMAIL":
        return { email: msg };
      case "USER_ALREADY_EXISTS":
        return { email: "An account with this email already exists." };
      case "USER_NOT_FOUND":
        return { email: "No account found for this email." };
      case "PASSWORD_TOO_SHORT":
      case "PASSWORD_TOO_LONG":
      case "INVALID_PASSWORD":
        return { password: msg };
      case "INVALID_EMAIL_OR_PASSWORD":
        // Ambiguous by design — flag both fields, message under password
        return { email: "", password: "Invalid email or password." };
      default:
        return { form: msg };
    }
  };

  const handleAuth = async () => {
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      shakeFields(clientErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const { error } = isSignIn
        ? await authClient.signIn.email({
            email: email.trim(),
            password,
          })
        : await authClient.signUp.email({
            email: email.trim(),
            password,
            name: email.trim().split("@")[0],
          });

      if (error) {
        const mapped = mapServerError(error.code, error.message);
        setErrors(mapped);
        shakeFields(mapped);
        return;
      }

      window.location.href = getSafeRedirect();
    } catch (err) {
      console.error(`${mode} failed:`, err);
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const next: AuthMode = isSignIn ? "sign-up" : "sign-in";
    setMode(next);
    setErrors({});
    window.history.pushState(null, "", `/${next}`);
  };

  return (
    <div className="relative w-screen h-screen md:w-auto md:h-auto md:max-w-[50vw] md:min-w-180 md:max-h-[60vh] md:min-h-100 bg-paper drop-shadow-md overflow-hidden">
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
              className="flex flex-col gap-2 w-full"
            >
              <motion.div animate={emailShake} className="flex flex-col gap-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="Enter your email"
                  aria-invalid={"email" in errors}
                  className={`${inputBase} ${"email" in errors ? inputErr : inputOk}`}
                />
                <FieldError message={errors.email} />
              </motion.div>

              <motion.div
                animate={passwordShake}
                className="flex flex-col gap-1"
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder={
                    isSignIn ? "Enter your password" : "Create a password"
                  }
                  aria-invalid={"password" in errors}
                  className={`${inputBase} ${"password" in errors ? inputErr : inputOk}`}
                />
                <FieldError message={errors.password} />
              </motion.div>

              {!isSignIn && (
                <motion.div
                  animate={confirmShake}
                  className="flex flex-col gap-1"
                >
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError("confirmPassword");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                    placeholder="Confirm your password"
                    aria-invalid={"confirmPassword" in errors}
                    className={`${inputBase} ${"confirmPassword" in errors ? inputErr : inputOk}`}
                  />
                  <FieldError message={errors.confirmPassword} />
                </motion.div>
              )}

              <FieldError message={errors.form} />

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
              layout
              onClick={handleAuth}
              disabled={loading}
              custom={formDir}
              variants={itemVariants}
              className="bg-ink flex items-center justify-center gap-2 text-paper uppercase text-xs px-4 py-2 tracking-wide border rounded-sm border-ink hover:bg-paper hover:text-ink disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-300 w-full"
            >
              <motion.span layout="position">
                {loading
                  ? isSignIn
                    ? "Signing In"
                    : "Creating Account"
                  : isSignIn
                    ? "Sign In"
                    : "Create Account"}
              </motion.span>
              <AnimatePresence initial={false} mode="popLayout">
                {loading && (
                  <motion.span
                    key="spinner"
                    layout
                    initial={{ opacity: 0, width: 0, scale: 0.6 }}
                    animate={{ opacity: 1, width: 16, scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0.6 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center justify-center overflow-hidden"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: "linear",
                      }}
                      className="inline-flex"
                    >
                      <LoaderIcon size={16} />
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
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
