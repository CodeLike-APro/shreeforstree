import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CustomCheckbox from "./CustomCheckbox";
import Icons from "../../assets/Icons/Icons";
import { useLocation } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const PRICE_RANGES = [
  { id: "below-1k", label: "Below ₹1,000", min: 0, max: 1000 },
  { id: "1k-2k", label: "₹1,000 – ₹2,000", min: 1000, max: 2000 },
  { id: "2k-3k", label: "₹2,000 – ₹3,000", min: 2000, max: 3000 },
  { id: "3k-4k", label: "₹3,000 – ₹4,000", min: 3000, max: 4000 },
  { id: "4k-5k", label: "₹4,000 – ₹5,000", min: 4000, max: 5000 },
  { id: "above-5k", label: "Above ₹5,000", min: 5000, max: Infinity },
];

const Filter = ({ products = [], onFilter }) => {
  const filterRef = useRef(null);
  const location = useLocation();

  // Selection states
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);

  // Expand/collapse state
  const [expandedTags, setExpandedTags] = useState(false);
  const [expandedSize, setExpandedSize] = useState(false);
  const [expandedColor, setExpandedColor] = useState(false);
  const [expandedPriceRange, setExpandedPriceRange] = useState(false);

  // Refs for smooth height animation
  const tagsRef = useRef(null);
  const sizeRef = useRef(null);
  const colorRef = useRef(null);
  const priceRef = useRef(null);

  // Extract unique values from all products
  const tags = [
    ...new Set(products.flatMap((p) => p.tags || [])), // ✅ Fix: Extract from tags
  ];
  const sizes = [...new Set(products.flatMap((p) => p.sizes || []))];
  const colors = [
    ...new Set(products.flatMap((p) => (p.color ? [p.color] : []))),
  ];

  // ✅ Pin sidebar with GSAP ScrollTrigger
  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;

    ScrollTrigger.getAll()
      .filter((t) => t.vars?.trigger === el)
      .forEach((t) => t.kill());

    const timeout = setTimeout(() => {
      const st = ScrollTrigger.create({
        trigger: el,
        scroller: "body",
        start: "top 15%",
        endTrigger: "footer",
        end: "top bottom",
        pin: true,
        pinSpacing: true,
        markers: false,
        invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();
      return () => st.kill();
    }, 200);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  // ✅ Smooth expand/collapse height
  const animateHeight = (ref, isExpanded) => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      height: isExpanded ? el.scrollHeight : 0,
      opacity: isExpanded ? 1 : 0,
      duration: 0.25,
      ease: "power2.inOut",
    });
  };

  useEffect(() => {
    animateHeight(tagsRef, expandedTags);
    animateHeight(sizeRef, expandedSize);
    animateHeight(colorRef, expandedColor);
    animateHeight(priceRef, expandedPriceRange);
  }, [expandedTags, expandedSize, expandedColor, expandedPriceRange]);

  // ✅ Toggle helper
  const toggleSelection = (value, setFn) => {
    setFn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // ✅ Filtering logic
  useEffect(() => {
    let filtered = [...products];

    // Tags (used instead of category)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        p.tags?.some((tag) => selectedTags.includes(tag))
      );
    }

    // Size
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );
    }

    // Color
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) => selectedColors.includes(p.color));
    }

    // Price
    if (selectedPrices.length > 0) {
      filtered = filtered.filter((p) => {
        const price = parseInt(p.currentPrice.replace(/\D/g, ""), 10);
        return selectedPrices.some(
          (range) => price >= range.min && price <= range.max
        );
      });
    }

    onFilter(filtered);
  }, [selectedTags, selectedSizes, selectedColors, selectedPrices, onFilter]);

  return (
    <div
      ref={filterRef}
      className="absolute rounded-r-[0.5vw] left-0 h-[80vh] w-[24vw] flex flex-col gap-6 bg-[#AC6B5C] text-[#F5D3C3] px-5 py-10 overflow-y-auto transition-colors duration-500 ease-in-out"
    >
      <div className="flex flex-col justify-between gap-2 items-start mb-8">
        <div>
          <div className="flex gap-3 items-center">
            <Icons.FilterIcon size="24" />
            <h3 className="text-4xl uppercase font-bold tracking-[0.4vw]">
              Filters
            </h3>
          </div>
        </div>

        {/* 🧹 Clear All Button */}
        <div className="h-[1vh]">
          {(selectedTags.length ||
            selectedSizes.length ||
            selectedColors.length ||
            selectedPrices.length) > 0 && (
            <button
              onClick={() => {
                setSelectedTags([]);
                setSelectedSizes([]);
                setSelectedColors([]);
                setSelectedPrices([]);
              }}
              className="text-sm uppercase tracking-[0.1vw] text-[#F5D3C3] bg-[#8C4F40] px-3 py-1 rounded-md hover:bg-[#7B4336] transition-all duration-300"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ✅ TAG FILTER (was Category) */}
      <FilterSection
        title="Categories"
        expanded={expandedTags}
        onToggle={() => setExpandedTags((prev) => !prev)}
        innerRef={tagsRef}
        options={tags}
        selected={selectedTags}
        setSelected={setSelectedTags}
        toggleSelection={toggleSelection}
      />

      {/* Size Filter */}
      <FilterSection
        title="Sizes"
        expanded={expandedSize}
        onToggle={() => setExpandedSize((prev) => !prev)}
        innerRef={sizeRef}
        options={sizes}
        selected={selectedSizes}
        setSelected={setSelectedSizes}
        toggleSelection={toggleSelection}
      />

      {/* Color Filter */}
      <FilterSection
        title="Colors"
        expanded={expandedColor}
        onToggle={() => setExpandedColor((prev) => !prev)}
        innerRef={colorRef}
        options={colors}
        selected={selectedColors}
        setSelected={setSelectedColors}
        toggleSelection={toggleSelection}
      />

      {/* Price Filter */}
      <FilterSection
        title="Price Range"
        expanded={expandedPriceRange}
        onToggle={() => setExpandedPriceRange((prev) => !prev)}
        innerRef={priceRef}
        options={PRICE_RANGES}
        selected={selectedPrices}
        setSelected={setSelectedPrices}
        toggleSelection={toggleSelection}
        isRange
      />
    </div>
  );
};

// 🔹 Reusable Filter Section
const FilterSection = ({
  title,
  expanded,
  onToggle,
  innerRef,
  options,
  selected,
  setSelected,
  toggleSelection,
  isRange = false,
}) => (
  <div className="flex flex-col transition-all duration-300 ease-in-out">
    <div
      className={`flex justify-between items-center cursor-pointer select-none transition-all duration-300 ${
        expanded ? "text-base" : "text-xl"
      }`}
      onClick={onToggle}
    >
      <h4
        className={`${
          expanded
            ? "font-light tracking-[0.2vw]"
            : "font-semibold tracking-[0.4vw]"
        } uppercase transition-all duration-300`}
      >
        {title}
      </h4>
      <span className="text-lg transition-all duration-300">
        {expanded ? "−" : "+"}
      </span>
    </div>

    <div
      ref={innerRef}
      className={`overflow-hidden py-[1vh] pl-[2vw] transition-all duration-300 ${
        expanded ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ height: 0, opacity: 0 }}
    >
      {options.map((opt) => {
        const key = isRange ? opt.id : opt;
        const label = isRange ? opt.label : opt;
        const checked = isRange
          ? selected.some((p) => p.id === opt.id)
          : selected.includes(opt);

        return (
          <CustomCheckbox
            key={key}
            label={label}
            checked={checked}
            onChange={() => toggleSelection(opt, setSelected)}
          />
        );
      })}
    </div>
  </div>
);

export default Filter;
