import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";

// ✅ Normalize tag helper (still useful for consistency)
const normalizeTag = (tag) =>
  tag
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const AllProducts = () => {
  const [products, setProducts] = useState([]); // All products
  const [filteredProducts, setFilteredProducts] = useState([]); // Filtered ones
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));

        const fetched = snapshot.docs.map((doc) => {
          const p = doc.data();

          // ✅ Handle both `images[]` and `img` fields
          const imagesArray = Array.isArray(p.images)
            ? p.images.filter((url) => url && typeof url === "string")
            : p.img
            ? [p.img]
            : [];

          // ✅ Safely parse price fields
          const currentPrice =
            typeof p.currentPrice === "string"
              ? p.currentPrice
              : p.currentPrice?.toString() || p.price?.toString() || "0";

          const price =
            typeof p.price === "string"
              ? p.price
              : p.price?.toString() || p.currentPrice?.toString() || "0";

          return {
            id: doc.id,
            title: p.title || "Untitled Product",
            description: p.description || "",
            tags: Array.isArray(p.tags) ? p.tags : [],
            sizes: Array.isArray(p.sizes) ? p.sizes : [],
            color: p.color || "",
            price,
            currentPrice,
            img: imagesArray[0] || "/fallback-user-icon.svg",
            gallery:
              imagesArray.length > 0
                ? imagesArray
                : ["/fallback-user-icon.svg"],
          };
        });
        console.log("🔥 Raw Firestore products:", snapshot.docs.length, "docs");
        console.log("🧩 Parsed products:", fetched);
        // 🚀 No manual filtering — keep all products (even "banner" ones)
        setProducts(fetched);
        setFilteredProducts(fetched);
      } catch (err) {
        console.error("🔥 Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Update list when filters change
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Loading products...
      </div>
    );
  }
  console.log("🧩 Rendering Cards with:", filteredProducts); // ✅ move this above return
  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[7vw] lg:pt-[3vw] lg:pl-[20vw]">
      <Filter products={products} onFilter={handleFilter} />
      <div className="flex justify-center items-center text-3xl lg:text-6xl uppercase tracking-[2vw] lg:tracking-[.7vw] text-[#A96A5A] mb-[7vw] lg:mb-[1.5vw]">
        All Products
      </div>

      <Cards cards={filteredProducts} layout="grid" />
    </div>
  );
};

export default AllProducts;
