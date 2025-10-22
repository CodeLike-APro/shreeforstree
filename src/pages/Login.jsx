import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  createUserWithEmailAndPassword, // 👈 ADD THIS
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [mode, setMode] = useState("login"); // login | signup | magic
  const [shake, setShake] = useState("");
  const [magicSent, setMagicSent] = useState(false); // don't clear when we just sent link
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  const shakeField = (id) => {
    setShake(id);
    setTimeout(() => setShake(""), 500);
  };

  // SIGNUP WITH EMAIL
  const handleSignup = async (e) => {
    e.preventDefault();
    resetErrors();

    if (!email.trim()) {
      setEmailError("Email is required");
      shakeField("email");
      return;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      shakeField("password");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/user"); // redirect after signup success
    } catch (err) {
      console.error(err.code);
      if (err.code === "auth/email-already-in-use") {
        setEmailError("This email is already registered");
        shakeField("email");
      } else if (err.code === "auth/invalid-email") {
        setEmailError("Invalid email address");
        shakeField("email");
      } else if (err.code === "auth/weak-password") {
        setPasswordError("Password must be at least 6 characters");
        shakeField("password");
      } else {
        setPasswordError("Something went wrong. Please try again.");
      }
    }
  };

  useEffect(() => {
    // Handle sign-in link on the login page
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");

      if (!email) {
        email = window.prompt("Please confirm your email for sign-in");
      }

      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            console.log("✅ Passwordless login successful");
            window.localStorage.removeItem("emailForSignIn");
            navigate("/user"); // Redirect to user page after success
          })
          .catch((error) => {
            console.error("❌ Error completing passwordless login:", error);
            alert("The sign-in link is invalid or expired. Please try again.");
          });
      }
    }
  }, []);

  // <-- NEW: clear inputs & errors when switching mode
  useEffect(() => {
    // if we just sent a magic link, keep the email so the user sees confirmation;
    // otherwise clear everything
    if (!magicSent) {
      setEmail("");
    }
    setPassword("");
    resetErrors();
    // reset magicSent once we switch mode away from magic
    if (mode !== "magic") setMagicSent(false);
  }, [mode]); // runs whenever mode changes

  // EMAIL LOGIN
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    resetErrors();

    if (!email.trim() && !password.trim()) {
      setEmailError("Email is required");
      setPasswordError("Password is required");
      shakeField("both");
      return;
    }
    if (!email.trim()) {
      setEmailError("Email is required");
      shakeField("email");
      return;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      shakeField("password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/user");
    } catch (err) {
      console.error(err.code);
      if (err.code === "auth/invalid-email") {
        setEmailError("Invalid email address");
        shakeField("email");
      } else if (err.code === "auth/wrong-password") {
        setPasswordError("Incorrect email or password");
        shakeField("both");
      } else {
        setPasswordError("Something went wrong, try again");
      }
    }
  };

  // GOOGLE LOGIN
  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/user");
    } catch (err) {
      console.error(err);
    }
  };

  // MAGIC LINK
  const handleMagic = async (e) => {
    e.preventDefault();
    resetErrors();

    if (!email.trim()) {
      setEmailError("Enter a valid email");
      shakeField("email");
      return;
    }

    const actionCodeSettings = {
      url: "https://shreeforstree-nine.vercel.app/user",
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMagicSent(true); // keep email visible as confirmation
      alert("Passwordless sign-in link sent! Check your inbox ✨");
    } catch (err) {
      console.error(err.code);
      if (err.code === "auth/invalid-email") {
        setEmailError("Invalid email address");
        shakeField("email");
      } else {
        alert("Something went wrong while sending the link.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff9f7] to-[#fff]"
    >
      <motion.div
        layout
        className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-[0_4px_25px_rgba(169,106,90,0.08)] border border-[#EAD8D2]/50"
      >
        <motion.h2
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-2xl font-semibold text-[#A96A5A] mb-6"
        >
          {mode === "login"
            ? "Sign In to Shree For Stree"
            : mode === "signup"
            ? "Create an Account"
            : "Passwordless Sign-In ✨"}
        </motion.h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {mode !== "magic" && (
              <>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleGoogle}
                  className="w-full bg-[#A96A5A]/90 hover:bg-[#A96A5A] text-white py-2.5 rounded-md transition-all mb-5"
                >
                  Continue with Google
                </motion.button>

                <div className="flex items-center justify-center mb-5">
                  <span className="h-px bg-[#EAD8D2] w-1/3"></span>
                  <span className="text-xs text-[#A96A5A]/60 mx-2">OR</span>
                  <span className="h-px bg-[#EAD8D2] w-1/3"></span>
                </div>
              </>
            )}

            {/* EMAIL */}
            <motion.div
              animate={
                shake === "email" || shake === "both"
                  ? { x: [-6, 6, -4, 4, 0] }
                  : {}
              }
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <input
                id="email-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-md p-2 text-sm focus:outline-none transition-all ${
                  emailError
                    ? "border-red-400 focus:ring-1 focus:ring-red-400"
                    : "border-[#EBDAD5] focus:ring-1 focus:ring-[#A96A5A]"
                }`}
              />
              {emailError && (
                <motion.p
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {emailError}
                </motion.p>
              )}
            </motion.div>

            {/* PASSWORD (not for magic link) */}
            {mode !== "magic" && (
              <motion.div
                animate={
                  shake === "password" || shake === "both"
                    ? { x: [-6, 6, -4, 4, 0] }
                    : {}
                }
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <input
                  id="password-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-md p-2 text-sm focus:outline-none transition-all ${
                    passwordError
                      ? "border-red-400 focus:ring-1 focus:ring-red-400"
                      : "border-[#EBDAD5] focus:ring-1 focus:ring-[#A96A5A]"
                  }`}
                />
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-1"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* ACTION BUTTON */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={
                mode === "magic"
                  ? handleMagic
                  : mode === "signup"
                  ? handleSignup
                  : handleEmailAuth
              }
              className="w-full bg-[#A96A5A] hover:bg-[#8E584C] text-white py-2 rounded-md transition-all"
            >
              {mode === "magic"
                ? "Send Passwordless Link"
                : mode === "signup"
                ? "Create Account"
                : "Login with Email"}
            </motion.button>

            {/* SWITCH LINKS */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-[#A96A5A]/80 mt-5"
            >
              {mode === "login" && (
                <>
                  <button
                    onClick={() => setMode("magic")}
                    className="hover:text-[#A96A5A] transition-all hover:underline"
                  >
                    Try Passwordless Sign-In ✨
                  </button>
                  <p className="mt-2">
                    Don’t have an account?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-[#A96A5A] hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                </>
              )}
              {mode === "signup" && (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-[#A96A5A] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === "magic" && (
                <p>
                  Want to use password login?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-[#A96A5A] hover:underline"
                  >
                    Back to Email Login
                  </button>
                </p>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Login;
