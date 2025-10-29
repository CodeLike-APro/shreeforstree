// src/pages/New-Arrivals.jsx
import React, { useState, useEffect, useCallback } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // ✅ import Firestore instance

// Utility: normalize tags for consistent matching
const normalizeTag = (tag) =>
  tag
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const NewArrivals = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch products from Firestore
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = snapshot.docs.map((doc) => {
          const data = doc.data();

          // 🧠 Handle images (single + multiple)
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

        // ✅ Filter products tagged with "new arrival" or "newarrival"
        const filteredArrivals = fetchedProducts.filter((p) =>
          p.tags?.some(
            (tag) =>
              normalizeTag(tag) === "newarrival" ||
              normalizeTag(tag) === "newarrivals"
          )
        );

        setNewArrivals(filteredArrivals);
        setFilteredProducts(filteredArrivals);
      } catch (error) {
        // console.error("🔥 Error fetching New Arrivals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  // ✅ Handle filters (from Filter component)
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Loading New Arrivals...
      </div>
    );
  }

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[7vw] lg:pt-[3vw] lg:pl-[20vw]">
      <Filter products={newArrivals} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-4xl lg:text-6xl uppercase tracking-[1vw] lg:tracking-[.7vw] text-[#A96A5A] mb-[7vw] lg:mb-[1.5vw]">
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
