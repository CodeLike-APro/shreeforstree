import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { notify } from "../components/common/toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [mode, setMode] = useState("login"); // login | signup
  const [shake, setShake] = useState("");

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();
  const emailControls = useAnimation();
  const passwordControls = useAnimation();

  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  const shakeField = (field) => {
    const controls =
      field === "email"
        ? emailControls
        : field === "password"
        ? passwordControls
        : null;

    if (field === "both") {
      emailControls.start({
        x: [-8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      });
      passwordControls.start({
        x: [-8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      });
      return;
    }

    if (controls) {
      controls.start({
        x: [-8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      });
    }
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
      navigate("/"); // redirect after signup success
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
        shakeField("password");
      }
    }
  };

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
      navigate("/");
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
        shakeField("password");
      }
    }
  };

  // GOOGLE LOGIN
  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  // FORGOT PASSWORD (Email only)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetErrors();

    if (!email.trim()) {
      setEmailError("Please enter your email");
      shakeField("email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      notify.success(
        "If an account is associated with this email, a password reset link will be sent to it."
      );
      setMode("login");
    } catch (err) {
      console.error(err.code);
      if (err.code === "auth/invalid-email") {
        setEmailError("Invalid email format");
        shakeField("email");
      } else {
        notify.error("Something went wrong. Please try again.");
      }
    }
  };

  useEffect(() => {
    // Clear fields and errors when switching between slides
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setShake("");
  }, [mode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[90vh] flex items-center justify-center bg-gradient-to-br from-[#fff9f7] to-[#fff]"
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
            : "Reset Your Password"}
        </motion.h2>

        <AnimatePresence mode="wait">
          {/* LOGIN SLIDE */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
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

              {/* EMAIL INPUT */}
              <motion.div animate={emailControls} className="mb-4">
                <input
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

              {/* PASSWORD INPUT */}
              <motion.div animate={passwordControls} className="mb-4">
                <input
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

              {/* LOGIN BUTTON */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleEmailAuth}
                className="w-full bg-[#A96A5A] hover:bg-[#8E584C] text-white py-2 rounded-md transition-all"
              >
                Login with Email
              </motion.button>

              {/* SWITCH TO SIGNUP */}
              <div className="text-center text-sm text-[#A96A5A]/80 mt-5">
                <p>
                  Don’t have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-[#A96A5A] hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* SIGNUP SLIDE */}
          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
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

              {/* SIGNUP EMAIL + PASSWORD */}
              <motion.div className="mb-4">
                <input
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
              </motion.div>

              <motion.div className="mb-4">
                <input
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
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSignup}
                className="w-full bg-[#A96A5A] hover:bg-[#8E584C] text-white py-2 rounded-md transition-all"
              >
                Create Account
              </motion.button>

              <div className="text-center text-sm text-[#A96A5A]/80 mt-5">
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-[#A96A5A] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* FORGOT PASSWORD SLIDE */}
          {mode === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                animate={shake === "email" ? { x: [-6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <input
                  type="email"
                  placeholder="Enter your registered email"
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

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleForgotPassword}
                className="w-full bg-[#A96A5A] hover:bg-[#8E584C] text-white py-2 rounded-md transition-all"
              >
                Send Reset Link
              </motion.button>

              <div className="text-center text-sm text-[#A96A5A]/80 mt-5">
                <button
                  onClick={() => setMode("login")}
                  className="text-[#A96A5A] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Login;
