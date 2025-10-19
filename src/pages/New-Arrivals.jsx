// src/pages/New-Arrivals.jsx
import React, { useState, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import allProducts from "../data/products.json"; // ✅ centralized product data

const NewArrivals = () => {
  // ✅ Filter only "NewArrival" products
  const newArrivals = allProducts.filter((p) =>
    p.tags?.some((tag) => tag.toLowerCase() === "new arrival")
  );

  const [filteredProducts, setFilteredProducts] = useState(newArrivals);

  // ✅ Prevent unnecessary re-renders
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[3vw] pl-[20vw]">
      <Filter products={newArrivals} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-6xl uppercase tracking-[.7vw] text-[#A96A5A] mb-[1.5vw]">
        New Arrivals
      </div>
      {filteredProducts.length > 0 ? (
        <Cards cards={filteredProducts} layout="grid" />
      ) : (
        <p className="text-[#A96A5A] text-lg italic mt-[5vh]">
          No New Arrivals found at the moment.
        </p>
      )}
    </div>
  );
};

export default NewArrivals;
