import React, { useState, useEffect } from "react";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "../firebase"; // make sure firebase.js exports initialized auth
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // --- Check if user returned from magic link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem("emailForSignIn");

      if (!storedEmail) {
        storedEmail = window.prompt(
          "Please confirm your email to complete sign-in"
        );
      }

      signInWithEmailLink(auth, storedEmail, window.location.href)
        .then((result) => {
          window.localStorage.removeItem("emailForSignIn");
          setMessage("✅ Successfully signed in!");
          navigate("/"); // redirect to home or user page
        })
        .catch((error) => {
          console.error(error);
          setMessage("❌ Failed to verify link. Try again.");
        });
    }
  }, [navigate]);

  // --- Send Magic Link
  const sendLink = async () => {
    if (!email) return setMessage("Please enter an email address");
    const actionCodeSettings = {
      url: "https://shreeforstree-nine.vercel.app/login",
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMessage("📩 Magic link sent! Check your email.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error sending magic link.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fff9f7] text-[#b17362]">
      <h1 className="text-3xl uppercase tracking-[0.3vw] mb-6">Sign In</h1>
      <input
        type="email"
        placeholder="Enter your email"
        className="border border-[#A96A5A] rounded-md px-4 py-2 w-80 text-center outline-none focus:ring-2 focus:ring-[#b17362] transition-all"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={sendLink}
        className="mt-4 bg-[#A96A5A] text-white px-8 py-2 rounded-md uppercase tracking-[0.2vw] hover:bg-[#8e5546] transition-all duration-200"
      >
        Send Magic Link
      </button>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default Login;
