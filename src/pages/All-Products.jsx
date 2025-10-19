import React, { useState, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import allProducts from "../data/products.json"; // ✅ Centralized data import

const AllProducts = () => {
  // ✅ State for filtered product list
  const [filteredProducts, setFilteredProducts] = useState(allProducts);

  // ✅ Update state only when filters change
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="product-page min-h-screen right-0 flex flex-col items-center pt-[3vw] pl-[20vw]">
      <Filter products={allProducts} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-6xl uppercase tracking-[.7vw] text-[#A96A5A] mb-[1.5vw]">
        All Products
      </div>
      <Cards cards={filteredProducts} layout="grid" />
    </div>
  );
};

export default AllProducts;
