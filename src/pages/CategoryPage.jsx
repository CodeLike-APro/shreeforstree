// src/pages/CategoryPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Cards from "../components/common/Cards";
import Filter from "../components/common/Filter";

const CategoryPage = () => {
  const { tagName } = useParams();
  const location = useLocation();

  // ✅ Derive tag from URL or passed state
  const tag =
    location.state?.tag || tagName.replace(/-/g, " ").toLowerCase().trim();

  const [categoryProducts, setCategoryProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = snapshot.docs.map((doc) => {
          const data = doc.data();

          const imagesArray = Array.isArray(data.images)
            ? data.images.filter((url) => url && typeof url === "string")
            : data.img
            ? [data.img]
            : [];

          return {
            id: doc.id,
            title: data.title || "Untitled Product",
            description: data.description || "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            color: data.color || "",
            price: data.price || "0",
            currentPrice: data.currentPrice || data.price || "0",
            img: imagesArray[0] || "/fallback-user-icon.svg",
            gallery:
              imagesArray.length > 0
                ? imagesArray
                : ["/fallback-user-icon.svg"],
          };
        });

        // ✅ Filter products by tag name
        const filtered = products.filter((p) =>
          p.tags?.some(
            (t) =>
              t.toLowerCase().replace(/\s+/g, "-") ===
              tagName.toLowerCase().trim()
          )
        );

        setCategoryProducts(filtered);
        setFilteredProducts(filtered);
      } catch (error) {
        console.error("🔥 Error fetching category products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [tagName]);

  // ✅ Handle filter changes
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Loading {tag} products...
      </div>
    );
  }

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
