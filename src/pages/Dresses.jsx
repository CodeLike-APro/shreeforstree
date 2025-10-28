import React, { useState, useEffect, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // ✅ Ensure your firebase.js exports db

// Utility function to clean and normalize tags
const normalizeTag = (tag) =>
  tag
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const Dresses = () => {
  const [dresses, setDresses] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch products from Firestore
  useEffect(() => {
    const fetchDresses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = snapshot.docs.map((doc) => {
          const data = doc.data();

          // 🧠 Handle both single and multiple image fields
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

        // ✅ Filter only products with tag “dress” or “dresses”
        const filteredDresses = fetchedProducts.filter((p) =>
          p.tags?.some(
            (tag) =>
              normalizeTag(tag) === "dress" || normalizeTag(tag) === "dresses"
          )
        );

        setDresses(filteredDresses);
        setFilteredProducts(filteredDresses);
      } catch (error) {
        console.error("🔥 Error fetching dresses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDresses();
  }, []);

  // ✅ Update products on filter
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Loading Dresses...
      </div>
    );
  }

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[7vw] lg:pt-[3vw] lg:pl-[20vw]">
      {/* 🧭 Sidebar Filter */}
      <Filter products={dresses} onFilter={handleFilter} />
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
