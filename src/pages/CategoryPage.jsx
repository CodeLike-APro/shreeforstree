// src/pages/CategoryPage.jsx
import React, { useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import Cards from "../components/common/Cards";
import Filter from "../components/common/Filter";
import allProducts from "../data/products.json";

const CategoryPage = () => {
  const { tagName } = useParams();
  const location = useLocation();

  // ✅ Derive tag from URL or passed state
  const tag =
    location.state?.tag || tagName.replace(/-/g, " ").toLowerCase().trim();

  // ✅ Filter products matching this tag
  const categoryProducts = allProducts.filter((p) =>
    p.tags?.some(
      (t) => t.toLowerCase().replace(/\s+/g, "-") === tagName.toLowerCase()
    )
  );

  // ✅ Manage filter state locally
  const [filteredProducts, setFilteredProducts] = useState(categoryProducts);

  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="product-page min-h-screen right-0 flex flex-col items-center pt-[3vw] lg:pl-[20vw]">
      {/* 🧩 Sidebar Filter */}
      <Filter products={categoryProducts} onFilter={handleFilter} />

      {/* 🧠 Page Title */}
      <h1 className="text-4xl text-[#A96A5A] uppercase tracking-[0.5vw] font-light mb-[3vw]">
        {tag}
      </h1>

      {/* 🎴 Product Cards */}
      {filteredProducts.length > 0 ? (
        <Cards cards={filteredProducts} layout="grid" />
      ) : (
        <p className="text-[#A96A5A] text-lg italic mt-[5vh]">
          No products found under “{tag}”.
        </p>
      )}
    </div>
  );
};

export default CategoryPage;
