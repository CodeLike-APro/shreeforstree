// src/pages/Kurties.jsx
import React, { useCallback, useState } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import allProducts from "../data/products.json"; // ✅ Centralized product data

const Kurties = () => {
  // 🧠 Extract products tagged with either "Kurti" or "Kurties"
  const kurtiesProducts = allProducts.filter(
    (p) =>
      p.tags &&
      p.tags.some((tag) =>
        ["kurti", "kurties"].includes(tag.toLowerCase().trim())
      )
  );

  const [filteredProducts, setFilteredProducts] = useState(kurtiesProducts);

  // ✅ Handle filters (memoized)
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[7vw] lg:pt-[3vw] lg:pl-[20vw]">
      <Filter products={kurtiesProducts} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-5xl lg:text-6xl uppercase tracking-[2vw] lg:tracking-[.7vw] text-[#A96A5A] mb-[7vw] lg:mb-[1.5vw]">
        Kurties
      </div>
      {filteredProducts.length === 0 ? (
        <p className="text-[#A96A5A] text-lg italic">
          No Kurties found in the catalog.
        </p>
      ) : (
        <Cards cards={filteredProducts} layout="grid" />
      )}
    </div>
  );
};

export default Kurties;
