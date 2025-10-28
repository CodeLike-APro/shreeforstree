import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import React, { useRef } from "react";

const PageBreak = () => {
  const stringContainerRef = useRef(null);
  const stringRefs = useRef(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const el = stringContainerRef.current;
    if (!el) return;

    // ✅ Create animation
    const tween = gsap.fromTo(
      el,
      { scaleX: 0, opacity: 0 },
      {
        scaleX: 1,
        opacity: 1,
        transformOrigin: "center",
        duration: 1.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 60%",
          scrub: false,
          once: true, // ✅ triggers once per page load
        },
      }
    );

    // ✅ Cleanup safely (avoid ScrollTrigger.kill error)
    return () => {
      tween?.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const newPath = `M 0 20 Q ${x} ${y} 2500 20`;
    gsap.to(stringRefs.current, {
      attr: { d: newPath },
      duration: 0.3,
      ease: "power1.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(stringRefs.current, {
      attr: { d: "M 0 20 Q 1250 20 2500 20" },
      duration: 1.5,
      ease: "elastic.out(2, 0.1)",
    });
  };

  return (
    <div
      ref={stringContainerRef}
      className="stringContainer flex items-center justify-center"
    >
      <div className="string h-[20vh] w-[100vw]">
        <svg
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="bg-transparent"
          height="20vh"
          width="100vw"
          viewBox="0 0 2500 100"
        >
          <path
            ref={stringRefs}
            d="M 0 20 Q 1250 20 2500 20"
            stroke="#AC6B5C"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default PageBreak;
