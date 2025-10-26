import React, { useState, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import allProducts from "../data/products.json";

const Dresses = () => {
  // 🔍 Pre-filter only "dresses" tagged products for both filter and cards
  const dressesData = allProducts.filter(
    (p) =>
      p.tags &&
      p.tags.some((tag) =>
        ["dress", "dresses"].includes(tag.toLowerCase().trim())
      )
  );

  const [filteredProducts, setFilteredProducts] = useState(dressesData);

  // ✅ Handles filter logic updates
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[7vw] lg:pt-[3vw] lg:pl-[20vw]">
      {/* 🧭 Sidebar Filter */}
      <Filter products={dressesData} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-4xl lg:text-6xl uppercase tracking-[3vw] lg:tracking-[.7vw] text-[#A96A5A] mb-[7vw] lg:mb-[1.5vw]">
        Dresses
      </div>

      {/* 🪄 Cards Section */}
      {filteredProducts.length === 0 ? (
        <p className="text-[#A96A5A] text-lg italic">
          No Dresses found in the catalog.
        </p>
      ) : (
        <Cards cards={filteredProducts} layout="grid" />
      )}
    </div>
  );
};

export default Dresses;
