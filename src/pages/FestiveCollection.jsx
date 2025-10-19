// src/pages/FestiveCollection.jsx
import React, { useCallback, useState, useMemo } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import allProducts from "../data/products.json"; // ✅ use centralized product data

const FestiveCollection = () => {
  // 🧠 Memoize the festive products — only runs once
  const festiveProducts = useMemo(() => {
    return allProducts.filter((p) =>
      p.tags?.some((tag) => tag.toLowerCase() === "festive")
    );
  }, []);

  // 🧩 State for filtered festive products
  const [filteredProducts, setFilteredProducts] = useState(festiveProducts);

  // ✅ Avoid re-renders with useCallback
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[3vw] pl-[20vw]">
      <Filter products={festiveProducts} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-6xl uppercase tracking-[.7vw] text-[#A96A5A] mb-[1.5vw]">
        Festive
      </div>
      {filteredProducts.length > 0 ? (
        <Cards cards={filteredProducts} layout="grid" />
      ) : (
        <p className="text-[#A96A5A] text-lg italic mt-[5vh]">
          No Festives found at the moment.
        </p>
      )}
    </div>
  );
};

export default FestiveCollection;
