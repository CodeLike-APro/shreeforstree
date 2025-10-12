import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import React, { useRef } from "react";

const PageBreak = () => {
  const stringRefs = useRef(null);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(".stringContainer", {
      scaleX: 0,
      transformOrigin: "center",
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".stringContainer",
        start: "top 70%",
        end: "bottom 60%",
        markers: true,
      },
    });
    return () => {
      tween.kill();
      ScrollTrigger.kill();
    };
  }, []);

  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left; // X within SVG
    const y = e.clientY - bounds.top; // Y within SVG

    // Animate the curve dynamically based on mouse position
    const newPath = `M 50 100 Q ${x} ${y} 1450 100`;

    gsap.to(stringRefs.current, {
      attr: { d: newPath },
      duration: 0.3,
      ease: "power1.out",
    });
  };

  const handleMouseLeave = () => {
    // Return to original straight line
    gsap.to(stringRefs.current, {
      attr: { d: "M 50 100 Q 750 100 1450 100" },
      duration: 0.6,
      ease: "elastic.out(2, 0.1)",
    });
  };

  return (
    <div className="stringContainer flex items-center justify-center -mt-[7vh]">
      <div className="string h-[30vh] w-[70vw]">
        <svg
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="bg-transparent"
          height="30vh"
          width="70vw"
          viewBox="0 0 1500 200"
        >
          <path
            ref={stringRefs}
            d="M 50 100 Q 750 100 1450 100"
            stroke="black"
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
