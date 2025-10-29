// src/pages/FestiveCollection.jsx
import React, { useState, useEffect, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // ✅ make sure firebase exports db

// Utility: normalize tags for consistent comparisons
const normalizeTag = (tag) =>
  tag
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const FestiveCollection = () => {
  const [festiveProducts, setFestiveProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch festive products from Firestore
  useEffect(() => {
    const fetchFestiveProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = snapshot.docs.map((doc) => {
          const data = doc.data();

          // 🧠 Handle both single and multiple image structures
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

        // ✅ Filter products with tag “festive”
        const filteredFestive = fetchedProducts.filter((p) =>
          p.tags?.some((tag) => normalizeTag(tag) === "festive")
        );

        setFestiveProducts(filteredFestive);
        setFilteredProducts(filteredFestive);
      } catch (error) {
        // console.error("🔥 Error fetching festive products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFestiveProducts();
  }, []);

  // ✅ Handle filtering
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Loading festive collection...
      </div>
    );
  }

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[7vw] lg:pt-[3vw] lg:pl-[20vw]">
      <Filter products={festiveProducts} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-4xl lg:text-6xl uppercase tracking-[2vw] lg:tracking-[.7vw] text-[#A96A5A] mb-[7vw] lg:mb-[1.5vw]">
        Festive
      </div>
      {filteredProducts.length > 0 ? (
        <Cards cards={filteredProducts} layout="grid" />
      ) : (
        <p className="text-[#A96A5A] text-lg italic mt-[5vh]">
          No Festive products found at the moment.
        </p>
      )}
    </div>
  );
};

export default FestiveCollection;
