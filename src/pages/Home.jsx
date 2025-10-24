import React from "react";
import HomeTop from "../components/home/HomeTop";
import HomeMid from "../components/home/HomeMid";
import HomeBottom from "../components/home/HomeBottom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email === "ceoprinci@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div>
      {/* ✅ Show only if admin */}
      {isAdmin && (
        <button
          onClick={() => navigate("/admin")}
          className="fixed top-29 right-8 px-4 py-2 bg-[#A96A5A] text-white rounded-lg border border-[#A96A5A]/30 shadow-md hover:shadow-xl hover:scale-105 hover:bg-[#8E574B] active:scale-95 transition-all duration-300 ease-out z-50 animate-[float_3s_ease-in-out_infinite]"
        >
          Admin
        </button>
      )}
      <HomeTop />
      <HomeMid />
      <HomeBottom />
    </div>
  );
};

export default Home;
