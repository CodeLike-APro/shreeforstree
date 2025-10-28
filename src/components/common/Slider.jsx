import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";

const Slider = ({ slides = [] }) => {
  const sliderRef = useRef(null);
  const imageRefs = useRef([]);
  const progressRefs = useRef([]);
  const [active, setActive] = useState(0);

  const SLIDE_DURATION = 4000;
  const TRANSITION_DURATION = 1.2;
  const intervalRef = useRef(null);
  const activeRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sliderRef.current || slides.length === 0) return;

    const slidesEls = sliderRef.current.children;

    // set initial positions
    gsap.set(slidesEls, { x: "100%" });
    gsap.set(".slide-text", { autoAlpha: 0 });
    if (slidesEls[0])
      gsap.set(slidesEls[0].querySelector(".slide-text"), { autoAlpha: 1 });
    if (slidesEls[0]) gsap.set(slidesEls[0], { x: "0%" });
    gsap.set(progressRefs.current, { scaleX: 0, transformOrigin: "left" });

    // start autoplay a tiny bit later to ensure refs populated
    const t = setTimeout(() => startAutoplay(), 50);

    return () => {
      clearTimeout(t);
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [slides]);

  const resetProgressBars = () => {
    progressRefs.current.forEach((bar) => {
      if (bar) gsap.killTweensOf(bar);
    });
    gsap.set(progressRefs.current, { scaleX: 0, transformOrigin: "left" });
  };

  const animateProgress = (index) => {
    const bar = progressRefs.current[index];
    if (!bar) return;
    gsap.killTweensOf(bar);
    gsap.set(bar, { scaleX: 0, transformOrigin: "left" });
    gsap.to(bar, {
      scaleX: 1,
      transformOrigin: "left",
      ease: "linear",
      duration: SLIDE_DURATION / 1000,
    });
  };

  const showSlide = (rawNextIndex) => {
    if (!sliderRef.current) return;
    const total = slides.length;
    if (total === 0) return;

    // normalize next index
    let nextIndex = rawNextIndex % total;
    if (nextIndex < 0) nextIndex += total;

    const slidesEls = sliderRef.current.children;
    const prev = activeRef.current;

    // defensive checks
    if (!slidesEls[prev] || !slidesEls[nextIndex]) {
      // still try to advance activeRef so progress doesn't keep restarting on same index
      activeRef.current = nextIndex;
      setActive(nextIndex);
      return;
    }

    // if same index, still animate progress (avoid early return)
    if (nextIndex === prev) {
      animateProgress(nextIndex);
      return;
    }

    const prevSlide = slidesEls[prev];
    const nextSlide = slidesEls[nextIndex];
    const prevImg = imageRefs.current[prev];
    const nextImg = imageRefs.current[nextIndex];

    resetProgressBars();
    animateProgress(nextIndex);

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut", duration: TRANSITION_DURATION },
    });

    tl.to(prevSlide, { x: "-100%" }, 0)
      .to(prevImg || {}, { scale: 1.3 }, 0)
      .fromTo(nextSlide, { x: "100%" }, { x: "0%" }, "<")
      .fromTo(nextImg || {}, { scale: 1.3 }, { scale: 1 }, "<");

    const prevText = prevSlide.querySelector(".slide-text");
    const nextText = nextSlide.querySelector(".slide-text");

    // fade text out then in
    if (prevText) {
      gsap.to(prevText, {
        autoAlpha: 0,
        y: -20,
        duration: 0.6,
        ease: "power2.out",
      });
    }
    if (nextText) {
      gsap.fromTo(
        nextText,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          delay: 0.4,
          duration: 1,
          ease: "power2.out",
        }
      );
    }

    activeRef.current = nextIndex;
    setActive(nextIndex);
  };

  const startAutoplay = () => {
    // don't autoplay if there's 0 or 1 slide
    if (!slides || slides.length < 2) return;

    clearInterval(intervalRef.current);
    resetProgressBars();
    animateProgress(activeRef.current);

    intervalRef.current = window.setInterval(() => {
      const next = (activeRef.current + 1) % slides.length;
      showSlide(next);
    }, SLIDE_DURATION);
  };

  const handleDotClick = (index) => {
    clearInterval(intervalRef.current);
    showSlide(index);
    startAutoplay();
  };

  return (
    <div className="overflow-hidden w-[90vw] h-[50vw] lg:w-[95vw] lg:h-[85vh] relative rounded-[5vw] lg:rounded-[2vw] flex justify-center items-center">
      {/* SLIDES */}
      <div
        ref={sliderRef}
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
      >
        {slides.map((slide, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/product/${slide.id}`)}
            className="absolute top-0 left-0 w-full h-full overflow-hidden group"
          >
            {/* IMAGE */}
            <div className="w-full h-full flex items-center justify-center rounded-[5vw] lg:rounded-[2vw] overflow-hidden">
              <img
                ref={(el) => (imageRefs.current[idx] = el)}
                src={slide.img}
                alt={`slide-${idx}`}
                className="w-full h-full object-cover rounded-[2vw]"
              />
            </div>

            {/* DARK OVERLAY (behind text) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 z-[1]" />

            {/* TEXT CONTENT (above overlay, used for fade) */}
            <div className="slide-text absolute inset-0 z-[2] flex flex-col justify-center items-start px-[5vw] text-white">
              <h2 className="text-xl lg:text-6xl md:text-5xl font-semibold mb-1 lg:mb-3 drop-shadow-lg">
                {slide.title}
              </h2>
              <p className="w-[50%] lg:max-w-[500px] text-[2.5vw] lg:text-base md:text-lg mb-2 lg:mb-6 opacity-90 leading-relaxed">
                {slide.bannerDescription || slide.description || ""}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // prevents parent click
                  navigate(`/product/${slide.id}`);
                }}
                className="bg-[#A96A5A] text-white text-[3vw] lg:text-lg px-2.5 lg:px-6 py-1.5 lg:py-2 rounded-md hover:bg-[#91584b] transition-all shadow-lg group-hover:scale-[1.05] duration-200 cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DOTS / PROGRESS */}
      <div className="absolute bottom-0 w-full  flex items-end justify-center pb-2">
        <div className="flex gap-[0.6vw]">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`relative cursor-pointer overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${
            active === idx
              ? "w-[5vw] h-[0.7vw] lg:w-[1.7vw] lg:h-[0.6vw] rounded-full bg-[#A96A5A]"
              : "w-[1.7vw] h-[0.7vw] lg:w-[0.6vw] lg:h-[0.6vw] rounded-full bg-gray-300"
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
