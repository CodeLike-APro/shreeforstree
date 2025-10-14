import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const Slider = ({ slides }) => {
  const sliderRef = useRef(null);
  const imageRefs = useRef([]);
  const progressRefs = useRef([]);
  const [active, setActive] = useState(0);

  const SLIDE_DURATION = 4000;
  const TRANSITION_DURATION = 1.2;
  const intervalRef = useRef(null);
  const activeRef = useRef(0); // ✅ stable tracker for current index

  useEffect(() => {
    const slidesEls = sliderRef.current.children;

    // Set initial slide visible
    gsap.set(slidesEls, { x: "100%" });
    gsap.set(slidesEls[0], { x: "0%" });
    gsap.set(progressRefs.current, { scaleX: 0, transformOrigin: "left" });

    startAutoplay();

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, []);

  const resetProgressBars = () => {
    progressRefs.current.forEach((bar) => gsap.killTweensOf(bar));
    gsap.set(progressRefs.current, { scaleX: 0, transformOrigin: "left" });
  };

  const animateProgress = (index) => {
    const bar = progressRefs.current[index];

    // Kill any existing animation on this bar
    gsap.killTweensOf(bar);

    // Reset to 0
    gsap.set(bar, { scaleX: 0, transformOrigin: "left" });

    // Animate
    gsap.to(bar, {
      scaleX: 1,
      transformOrigin: "left",
      ease: "linear",
      duration: SLIDE_DURATION / 1000,
    });
  };

  const showSlide = (nextIndex) => {
    const slidesEls = sliderRef.current.children;
    const prev = activeRef.current;

    if (nextIndex === prev) return;

    const total = slides.length;
    if (nextIndex >= total) nextIndex = 0;
    if (nextIndex < 0) nextIndex = total - 1;

    const prevSlide = slidesEls[prev];
    const nextSlide = slidesEls[nextIndex];
    const prevImg = imageRefs.current[prev];
    const nextImg = imageRefs.current[nextIndex];

    // Reset progress
    resetProgressBars();
    animateProgress(nextIndex);

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut", duration: TRANSITION_DURATION },
    });

    tl.to(prevSlide, { x: "-100%" }, 0)
      .to(prevImg, { scale: 1.3 }, 0)
      .fromTo(nextSlide, { x: "100%" }, { x: "0%" }, "<")
      .fromTo(nextImg, { scale: 1.3 }, { scale: 1 }, "<");

    // Update both refs + state
    activeRef.current = nextIndex;
    setActive(nextIndex);
  };

  const startAutoplay = () => {
    clearInterval(intervalRef.current);
    resetProgressBars();
    animateProgress(activeRef.current);

    intervalRef.current = setInterval(() => {
      // ✅ use ref instead of stale state
      showSlide(activeRef.current + 1);
    }, SLIDE_DURATION);
  };

  const handleDotClick = (index) => {
    clearInterval(intervalRef.current);
    showSlide(index);
    startAutoplay();
  };

  return (
    <div className="overflow-hidden w-[95vw] h-[85vh] relative rounded-[2vw] flex justify-center items-center">
      {/* SLIDER */}
      <div
        ref={sliderRef}
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
      >
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="absolute top-0 left-0 w-full h-full overflow-hidden"
          >
            <div className="w-full h-full flex items-center justify-center rounded-[2vw] overflow-hidden">
              <img
                ref={(el) => (imageRefs.current[idx] = el)}
                src={slide}
                alt={`slide-${idx}`}
                className="w-full h-full object-cover rounded-[2vw]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* DOTS */}
      <div className="absolute bottom-0 h-[100%] w-full bg-gradient-to-t from-black/70 to-black/10 flex items-end justify-center pb-2">
        <div className="flex gap-[0.6vw]">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`relative cursor-pointer overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${
            active === idx
              ? "w-[1.7vw] h-[0.6vw] rounded-full bg-[#A96A5A]" // capsule for active
              : "w-[0.6vw] h-[0.6vw] rounded-full bg-gray-300" // dot for inactive
          }`}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gray-300"></div>
              <div
                ref={(el) => (progressRefs.current[idx] = el)}
                className="absolute top-0 left-0 w-full h-full bg-[#A96A5A] origin-left scale-x-0"
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slider;
