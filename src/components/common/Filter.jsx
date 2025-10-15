import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CustomCheckbox from "./CustomCheckbox";
gsap.registerPlugin(ScrollTrigger);

const Filter = ({ products = [], onFilter }) => {
  const filterRef = useRef(null);

  // Multiple selections as arrays
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Unique options (memoize with static products)
  const categories = [...new Set(products.map((p) => p.category))];
  const sizes = [...new Set(products.flatMap((p) => p.sizes || []))];
  const colors = [
    ...new Set(products.flatMap((p) => (p.color ? [p.color] : []))),
  ];

  // ✅ Pin filter while scrolling (GSAP)
  useEffect(() => {
    const el = filterRef.current;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 15%",
      endTrigger: "footer",
      end: "top 90%",
      pin: true,
      pinSpacing: false,
      markers: false,
    });

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // ✅ Toggle helper
  const toggleSelection = (value, setFn) => {
    setFn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // ✅ MAIN FILTER LOGIC
  useEffect(() => {
    let filtered = [...products];

    // Category filter
    if (selectedCategories.length > 0)
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category)
      );

    // Size filter
    if (selectedSizes.length > 0)
      filtered = filtered.filter((p) =>
        p.sizes?.some((s) => selectedSizes.includes(s))
      );

    // Color filter
    if (selectedColors.length > 0)
      filtered = filtered.filter((p) => selectedColors.includes(p.color));

    // Price sorting
    if (selectedPrices.includes("low-high")) {
      filtered.sort(
        (a, b) =>
          parseInt(a.currentPrice.replace(/\D/g, "")) -
          parseInt(b.currentPrice.replace(/\D/g, ""))
      );
    } else if (selectedPrices.includes("high-low")) {
      filtered.sort(
        (a, b) =>
          parseInt(b.currentPrice.replace(/\D/g, "")) -
          parseInt(a.currentPrice.replace(/\D/g, ""))
      );
    }

    // 🧠 IMPORTANT — Only trigger filter when filters actually change
    onFilter(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(selectedCategories),
    JSON.stringify(selectedSizes),
    JSON.stringify(selectedColors),
    JSON.stringify(selectedPrices),
  ]);

  return (
    <div
      ref={filterRef}
      className="absolute left-0 max-h-[70vh] w-[24vw] flex flex-col gap-6 bg-[#AC6B5C] text-[#F5D3C3] p-5 overflow-y-auto"
    >
      {/* CATEGORY FILTER */}
      <div className="flex flex-col">
        <h4 className="font-light mb-2 text-base tracking-[0.2vw] uppercase">
          Category
        </h4>
        {categories.map((cat) => (
          <CustomCheckbox
            key={cat}
            label={cat}
            checked={selectedCategories.includes(cat)}
            onChange={() => toggleSelection(cat, setSelectedCategories)}
          />
        ))}
      </div>

      {/* SIZE FILTER */}
      <div className="flex flex-col">
        <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
        {sizes.map((size) => (
          <label
            key={size}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={selectedSizes.includes(size)}
              onChange={() => toggleSelection(size, setSelectedSizes)}
              className="accent-[#A96A5A] cursor-pointer"
            />
            {size}
          </label>
        ))}
      </div>

      {/* COLOR FILTER */}
      <div className="flex flex-col">
        <h3 className="font-semibold mb-2 text-lg">Colors</h3>
        {colors.map((color) => (
          <label
            key={color}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={selectedColors.includes(color)}
              onChange={() => toggleSelection(color, setSelectedColors)}
              className="accent-[#A96A5A] cursor-pointer"
            />
            {color}
          </label>
        ))}
      </div>

      {/* PRICE SORT */}
      <div className="flex flex-col">
        <h3 className="font-semibold mb-2 text-lg">Sort by Price</h3>
        {["low-high", "high-low"].map((price) => (
          <label
            key={price}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={selectedPrices.includes(price)}
              onChange={() => toggleSelection(price, setSelectedPrices)}
              className="accent-[#A96A5A] cursor-pointer"
            />
            {price === "low-high" ? "Low to High" : "High to Low"}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Filter;
