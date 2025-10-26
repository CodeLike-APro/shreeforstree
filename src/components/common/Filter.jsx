import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CustomCheckbox from "./CustomCheckbox";
import Icons from "../../assets/Icons/Icons";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Selection states
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);

  const [expandedTags, setExpandedTags] = useState(false);
  const [expandedSize, setExpandedSize] = useState(false);
  const [expandedColor, setExpandedColor] = useState(false);
  const [expandedPriceRange, setExpandedPriceRange] = useState(false);

  const tags = [...new Set(products.flatMap((p) => p.tags || []))];
  const sizes = [...new Set(products.flatMap((p) => p.sizes || []))];
  const colors = [
    ...new Set(products.flatMap((p) => (p.color ? [p.color] : []))),
  ];

  // inside Filter component (replace your existing useEffect that creates the pin)
  // ✅ Simplified & stable pinning logic
  useEffect(() => {
    if (window.innerWidth < 1024) return; // disable pinning on mobile

    const el = filterRef.current;
    if (!el) return;

    // Kill previous pins for this element only
    ScrollTrigger.getAll()
      .filter((t) => t.vars?.trigger === el)
      .forEach((t) => t.kill());

    const st = ScrollTrigger.create({
      trigger: el,
      scroller: "body",
      start: "top 15%",
      endTrigger: "footer",
      end: "top bottom",
      pin: true,
      pinSpacing: true,
      markers: false, // turn true for debugging
      invalidateOnRefresh: true,
    });

    ScrollTrigger.refresh();

    return () => st.kill();
  }, [location.pathname]);

  const toggleSelection = (value, setFn) => {
    setFn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    let filtered = [...products];
    if (selectedTags.length > 0)
      filtered = filtered.filter((p) =>
        p.tags?.some((tag) => selectedTags.includes(tag))
      );
    if (selectedSizes.length > 0)
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );
    if (selectedColors.length > 0)
      filtered = filtered.filter((p) => selectedColors.includes(p.color));
    if (selectedPrices.length > 0)
      filtered = filtered.filter((p) => {
        const price = parseInt(p.currentPrice.replace(/\D/g, ""), 10);
        return selectedPrices.some(
          (range) => price >= range.min && price <= range.max
        );
      });
    onFilter(filtered);
  }, [selectedTags, selectedSizes, selectedColors, selectedPrices, onFilter]);

  // ✅ Handle mobile filter panel
  useEffect(() => {
    if (mobileOpen) {
      gsap.to(".mobile-filter", {
        y: "0%",
        duration: 0.4,
        ease: "power2.out",
      });
      document.body.style.overflow = "hidden";
    } else {
      // Collapse all filters when closing
      setExpandedTags(false);
      setExpandedSize(false);
      setExpandedColor(false);
      setExpandedPriceRange(false);

      gsap.to(".mobile-filter", {
        y: "100%",
        duration: 0.4,
        ease: "power2.in",
      });
      document.body.style.overflow = "auto";
    }
  }, [mobileOpen]);

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <div
        ref={filterRef}
        className="hidden lg:flex absolute rounded-r-[0.5vw] left-0 lg:h-[80vh] lg:w-[24vw] flex-col bg-[#AC6B5C] text-[#F5D3C3] overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 py-10">
          <FilterContent
            {...{
              selectedTags,
              selectedSizes,
              selectedColors,
              selectedPrices,
              setSelectedTags,
              setSelectedSizes,
              setSelectedColors,
              setSelectedPrices,
              expandedTags,
              expandedSize,
              expandedColor,
              expandedPriceRange,
              setExpandedTags,
              setExpandedSize,
              setExpandedColor,
              setExpandedPriceRange,
              toggleSelection,
              tags,
              sizes,
              colors,
            }}
          />
        </div>
      </div>

      {/* 📱 Floating Filter Button */}
      <button
        className="fixed bottom-20 right-5 z-[10000] bg-[#AC6B5C] text-[#F5D3C3] p-3 rounded-full shadow-lg lg:hidden active:scale-95 transition-transform"
        onClick={() => setMobileOpen(true)}
      >
        <Icons.FilterIcon size={24} />
      </button>

      {/* 📱 Mobile Filter Panel */}
      <div className="mobile-filter fixed bottom-0 left-0 right-0 top-0 bg-[#AC6B5C] text-[#F5D3C3] z-[10001] translate-y-full rounded-t-2xl overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#F5D3C3]/30">
          <h3 className="text-xl font-semibold tracking-[2px] uppercase">
            Filters
          </h3>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-2xl hover:rotate-90 transition-transform duration-300"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          <FilterContent
            {...{
              selectedTags,
              selectedSizes,
              selectedColors,
              selectedPrices,
              setSelectedTags,
              setSelectedSizes,
              setSelectedColors,
              setSelectedPrices,
              expandedTags,
              expandedSize,
              expandedColor,
              expandedPriceRange,
              setExpandedTags,
              setExpandedSize,
              setExpandedColor,
              setExpandedPriceRange,
              toggleSelection,
              tags,
              sizes,
              colors,
            }}
          />

          <button
            onClick={() => setMobileOpen(false)}
            className="mt-8 w-full bg-[#F5D3C3] text-[#8C4F40] py-3 rounded-md font-semibold uppercase tracking-[1px] hover:bg-[#e7c4b4] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

// 🔹 Reusable Filter Section
const FilterContent = ({
  selectedTags,
  selectedSizes,
  selectedColors,
  selectedPrices,
  setSelectedTags,
  setSelectedSizes,
  setSelectedColors,
  setSelectedPrices,
  expandedTags,
  expandedSize,
  expandedColor,
  expandedPriceRange,
  setExpandedTags,
  setExpandedSize,
  setExpandedColor,
  setExpandedPriceRange,
  toggleSelection,
  tagsRef,
  sizeRef,
  colorRef,
  priceRef,
  tags,
  sizes,
  colors,
  animateHeight,
}) => (
  <>
    <div className="flex flex-col justify-between gap-2 items-start mb-8">
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
          Clear All
        </button>
      )}
    </div>

    <FilterSection
      title="Categories"
      expanded={expandedTags}
      onToggle={() => setExpandedTags((prev) => !prev)}
      options={tags}
      selected={selectedTags}
      setSelected={setSelectedTags}
      toggleSelection={toggleSelection}
    />

    <FilterSection
      title="Sizes"
      expanded={expandedSize}
      onToggle={() => setExpandedSize((prev) => !prev)}
      options={sizes}
      selected={selectedSizes}
      setSelected={setSelectedSizes}
      toggleSelection={toggleSelection}
    />

    <FilterSection
      title="Colors"
      expanded={expandedColor}
      onToggle={() => setExpandedColor((prev) => !prev)}
      options={colors}
      selected={selectedColors}
      setSelected={setSelectedColors}
      toggleSelection={toggleSelection}
    />

    <FilterSection
      title="Price Range"
      expanded={expandedPriceRange}
      onToggle={() => setExpandedPriceRange((prev) => !prev)}
      options={PRICE_RANGES}
      selected={selectedPrices}
      setSelected={setSelectedPrices}
      toggleSelection={toggleSelection}
      isRange
    />
  </>
);

// 🔹 Section Component (same as before)
const FilterSection = ({
  title,
  expanded,
  onToggle,
  options,
  selected,
  setSelected,
  toggleSelection,
  isRange = false,
}) => (
  <div className="flex flex-col transition-all duration-300 ease-in-out">
    <div
      className="flex justify-between items-center cursor-pointer select-none"
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

    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          key={title}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.35, ease: "easeInOut" },
            opacity: { duration: 0.2, ease: "easeInOut" },
          }}
          className="overflow-hidden pl-[2vw]"
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
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default Filter;
