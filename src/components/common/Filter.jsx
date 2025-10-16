import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CustomCheckbox from "./CustomCheckbox";

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

  // Multiple selections
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Expand/collapse states
  const [expandedCategory, setExpandedCategory] = useState(false);
  const [expandedSize, setExpandedSize] = useState(false);
  const [expandedColor, setExpandedColor] = useState(false);
  const [expandedPriceRange, setExpandedPriceRange] = useState(false);

  // Refs for sections
  const categoryRef = useRef(null);
  const sizeRef = useRef(null);
  const colorRef = useRef(null);
  const priceRef = useRef(null);

  // Unique options
  const categories = [...new Set(products.map((p) => p.category))];
  const sizes = [...new Set(products.flatMap((p) => p.sizes || []))];
  const colors = [
    ...new Set(products.flatMap((p) => (p.color ? [p.color] : []))),
  ];

  // 🧠 Pin filter sidebar with GSAP
  useEffect(() => {
    const el = filterRef.current;

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 18%",
      endTrigger: "footer",
      end: "top bottom",
      pin: true,
      pinSpacing: true, // ✅ keeps layout natural
      markers: false,
    });

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // 🌀 Toggle helper (works for primitives + ranges)
  const toggleSelection = (value, setFn) => {
    setFn((prev) => {
      if (typeof value === "object" && ("min" in value || "id" in value)) {
        const exists = prev.some(
          (p) =>
            p.id === value.id || (p.min === value.min && p.max === value.max)
        );
        return exists
          ? prev.filter(
              (p) =>
                !(
                  p.id === value.id ||
                  (p.min === value.min && p.max === value.max)
                )
            )
          : [...prev, value];
      } else {
        return prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
      }
    });
  };

  // 💡 Animate smooth expand/collapse per section
  const animateHeight = (ref, isExpanded) => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, {
      height: isExpanded ? el.scrollHeight : 0,
      opacity: isExpanded ? 1 : 0,
      duration: 0.1,
      ease: "power1.inOut",
    });
  };

  useEffect(() => {
    animateHeight(categoryRef, expandedCategory);
    animateHeight(sizeRef, expandedSize);
    animateHeight(colorRef, expandedColor);
    animateHeight(priceRef, expandedPriceRange);
  }, [expandedCategory, expandedSize, expandedColor, expandedPriceRange]);

  // ✅ Main filtering logic
  useEffect(() => {
    let filtered = [...products];

    if (selectedCategories.length > 0)
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category)
      );

    if (selectedSizes.length > 0)
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );

    if (selectedColors.length > 0)
      filtered = filtered.filter((p) => selectedColors.includes(p.color));

    if (selectedPrices.length > 0) {
      filtered = filtered.filter((p) => {
        const price = parseInt(
          String(p.currentPrice || "").replace(/\D/g, ""),
          10
        );
        return selectedPrices.some(
          (range) => price >= range.min && price <= range.max
        );
      });
    }

    onFilter(filtered);
  }, [
    selectedCategories,
    selectedSizes,
    selectedColors,
    selectedPrices,
    onFilter,
  ]);

  return (
    <div
      ref={filterRef}
      className="absolute left-0 h-[80vh] w-[24vw] flex flex-col gap-6 bg-[#AC6B5C] text-[#F5D3C3] px-5 py-10 overflow-y-auto transition-colors duration-500 ease-in-out"
    >
      {/* CATEGORY FILTER */}
      <FilterSection
        title="Category"
        expanded={expandedCategory}
        onToggle={() => setExpandedCategory((prev) => !prev)}
        innerRef={categoryRef}
        options={categories}
        selected={selectedCategories}
        setSelected={setSelectedCategories}
        toggleSelection={toggleSelection}
      />

      {/* SIZE FILTER */}
      <FilterSection
        title="Size"
        expanded={expandedSize}
        onToggle={() => setExpandedSize((prev) => !prev)}
        innerRef={sizeRef}
        options={sizes}
        selected={selectedSizes}
        setSelected={setSelectedSizes}
        toggleSelection={toggleSelection}
      />

      {/* COLOR FILTER */}
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

      {/* PRICE RANGE FILTER */}
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

// 🔹 Reusable collapsible filter section component
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
    {/* Header */}
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

    {/* Options */}
    <div
      ref={innerRef}
      className={`overflow-hidden py-[1vh] pl-[2vw] transition-all duration-300 ${
        expanded ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ height: 0 }}
    >
      {options.map((opt) => {
        const key = isRange ? opt.id : opt;
        const label = isRange ? opt.label : opt;
        const checked = isRange
          ? selected.some((p) => p.id === opt.id)
          : selected.includes(opt);

        return (
          <div key={key}>
            <CustomCheckbox
              label={label}
              checked={checked}
              onChange={() => toggleSelection(opt, setSelected)}
            />
          </div>
        );
      })}
    </div>
  </div>
);

export default Filter;
