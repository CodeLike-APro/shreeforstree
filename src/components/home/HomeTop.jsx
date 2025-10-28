import React, { useEffect, useState } from "react";
import Slider from "../common/Slider";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase"; // Make sure your firebase.js exports db

const HomeTop = () => {
  const [bannerProducts, setBannerProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBannerProducts = async () => {
      try {
        // Fetch products where "tags" array contains "banner"
        const q = query(
          collection(db, "products"),
          where("tags", "array-contains", "banner")
        );
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => {
          const p = doc.data();

          // ✅ Normalize image (use first from images[] or fallback)
          const image =
            p.img ||
            (Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : "/fallback-user-icon.svg"); // fallback image

          return {
            id: doc.id,
            title: p.title || "Untitled Product",
            description: p.description || "",
            img: image,
            currentPrice:
              typeof p.currentPrice === "string"
                ? p.currentPrice
                : p.currentPrice?.toString() || p.price?.toString() || "0",
            price:
              typeof p.price === "string"
                ? p.price
                : p.price?.toString() || p.currentPrice?.toString() || "0",
            tags: Array.isArray(p.tags) ? p.tags : [],
          };
        });

        setBannerProducts(data);
      } catch (err) {
        console.error("🔥 Error fetching banner products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBannerProducts();
  }, []);

  return (
    <div className="pt-2 lg:pt-4 lg:pb-4 px-4 flex flex-col justify-center items-center overflow-hidden select-none">
      {loading ? (
        <p className="text-[#A96A5A] text-sm italic">Loading banners...</p>
      ) : bannerProducts.length > 0 ? (
        <Slider slides={bannerProducts} />
      ) : (
        <p className="text-[#A96A5A] text-sm italic">
          No banner products found.
        </p>
      )}
    </div>
  );
};

export default HomeTop;
