import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Categories = () => {
  const [tagImages, setTagImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ Collect all unique tags (except banner)
        const tags = [
          ...new Set(products.flatMap((product) => product.tags || [])),
        ].filter((tag) => tag.toLowerCase() !== "banner");

        // ✅ Select one category per unique product, up to total product count
        const tagsWithImages = [];
        const usedProducts = new Set();

        for (const product of products) {
          if (tagsWithImages.length >= products.length) break; // stop once limit hit

          const firstTag = (product.tags || []).find(
            (tag) => tag.toLowerCase() !== "banner"
          );

          if (!firstTag || usedProducts.has(product.id)) continue;

          const image =
            product?.img ||
            (Array.isArray(product?.images) && product.images.length > 0
              ? product.images[0]
              : "/NewArrivals/default.jpg");

          tagsWithImages.push({ name: firstTag, img: image });
          usedProducts.add(product.id);
        }

        // ✅ Limit to unique category names (edge case safeguard)
        const uniqueTags = Array.from(
          new Map(tagsWithImages.map((t) => [t.name.toLowerCase(), t])).values()
        );

        setTagImages(uniqueTags);

        setTagImages(tagsWithImages);
      } catch (error) {
        // console.error("🔥 Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center text-[#A96A5A] text-lg">
        Loading categories...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-center items-center text-4xl lg:text-6xl uppercase tracking-[1.5vw] lg:tracking-[1.1vw] text-[#A96A5A] mt-[4vw] lg:mt-[2vw] mb-[10vw] lg:mb-[1vw]">
        Categories
      </div>

      <div className="grid grid-cols-2 lg:flex justify-center gap-[5vw] lg:gap-[2vw] p-[2vw] flex-wrap">
        {tagImages.map((tag, i) => (
          <div
            key={i}
            className="category-card relative h-[50vh] lg:h-[80vh] lg:w-[30vw] group overflow-hidden cursor-pointer bg-black rounded-[0.5vw] shadow-md hover:shadow-xl transition-all duration-700"
          >
            <Link
              to={`/category/${encodeURIComponent(
                tag.name.toLowerCase().replace(/\s+/g, "-")
              )}`}
              state={{ tag: tag.name }}
            >
              <img
                className="object-cover h-full w-full transition-transform duration-700 group-hover:scale-110"
                src={tag.img}
                alt={tag.name}
                loading="lazy"
                onError={(e) => (e.target.src = "/NewArrivals/default.jpg")}
              />
              <div className="absolute top-0 left-0 flex justify-center items-end h-full w-full bg-gradient-to-t from-black/70 to-black/20 transition-all duration-700 group-hover:bg-black/10">
                <h2 className="text-white text-3xl font-light tracking-[1vw] uppercase mb-[3vh] lg:mb-[10vh] px-[1vw] py-[0.6vh] transition-all duration-700 group-hover:tracking-[0.5vw]">
                  {tag.name}
                </h2>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
