import { gsap } from "gsap";
import React, { useRef, useEffect } from "react";

const CustomCheckbox = ({ label, checked, onChange }) => {
  const boxRef = useRef();

  useEffect(() => {
    if (checked) {
      gsap.fromTo(
        boxRef.current,
        { scale: 0.6, rotate: -20 },
        { scale: 1, rotate: 0, duration: 0.3, ease: "elastic.out(1, 0.4)" }
      );
    }
  }, [checked]);

  return (
    <label className="relative flex items-center gap-3 cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer hidden"
      />
      <span
        ref={boxRef}
        className="h-[2.5vh] w-[2.5vh] rounded-[0.5vh] border border-[#F5D3C3] flex items-center justify-center
  transition-all duration-300 peer-checked:bg-[#F5D3C3] peer-checked:border-[#F5D3C3]
  group-hover:scale-110 group-hover:shadow-[0_0_10px_#F5D3C3] peer-checked:shadow-[0_0_10px_#F5D3C3]"
      >
        <svg
          className="opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="text-[#F5D3C3] font-light tracking-wide">{label}</span>
    </label>
  );
};

export default CustomCheckbox;
