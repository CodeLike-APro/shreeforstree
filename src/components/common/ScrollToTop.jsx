// src/components/common/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Kill ONLY stale triggers but not during scroll
    // Only kill stale triggers that are tied to filters or route-specific components
    ScrollTrigger.getAll().forEach((t) => {
      const triggerEl = t.vars?.trigger;
      if (
        triggerEl &&
        (triggerEl.classList?.contains("filter") ||
          triggerEl.classList?.contains("route-specific"))
      ) {
        t.kill(false);
      }
    });

    // Small delay to ensure new page DOM and filter are rendered
    const timeout = setTimeout(() => {
      const navbar =
        document.querySelector("nav, .navbar, .Navbar, #NavBar") || null;
      const offset = navbar?.offsetHeight || 0;

      // Scroll to top using GSAP’s ScrollToPlugin
      gsap.to(window, {
        scrollTo: { y: 0, offsetY: offset },
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          // Refresh ScrollTriggers only AFTER scroll completes
          ScrollTrigger.refresh(true);
        },
      });
    });

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
