// src/pages/Kurties.jsx
import React, { useState, useEffect, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Utility: normalize tag names for consistent comparison
const normalizeTag = (tag) =>
  tag
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const Kurties = () => {
  const [kurtiesProducts, setKurtiesProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch Kurties from Firestore
  useEffect(() => {
    const fetchKurties = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = snapshot.docs.map((doc) => {
          const data = doc.data();

          // 🧠 Handle both single and multiple images
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

        // ✅ Filter products with tag “kurti” or “kurties”
        const filtered = products.filter((p) =>
          p.tags?.some(
            (tag) =>
              normalizeTag(tag) === "kurti" || normalizeTag(tag) === "kurties"
          )
        );

        setKurtiesProducts(filtered);
        setFilteredProducts(filtered);
      } catch (error) {
        console.error("🔥 Error fetching Kurties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKurties();
  }, []);

  // ✅ Handle filters (memoized)
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Loading Kurties...
      </div>
    );
  }

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
