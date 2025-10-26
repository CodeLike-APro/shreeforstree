// src/components/common/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // small delay to ensure page content renders
    const timeout = setTimeout(() => {
      const scrollContainer = document.querySelector("#main-content");
      if (!scrollContainer) return;

      gsap.to(scrollContainer, {
        scrollTo: { y: 0 },
        duration: 0.6,
        ease: "power2.inOut",
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
