import { useEffect } from "react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

const SmoothScroll = ({ children }) => {
  useEffect(() => {
    ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.1, // higher = smoother
      effects: true,
      normalizeScroll: true,
      smoothTouch: 0.2, // smoothness on touch devices
    });
  }, []);

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">{children}</div>
    </div>
  );
};

export default SmoothScroll;
