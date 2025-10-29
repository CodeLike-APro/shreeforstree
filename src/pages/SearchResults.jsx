import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Cards from "../components/common/Cards";
import Filter from "../components/common/Filter";

const SearchResults = () => {
  const location = useLocation();
  const [allProducts, setAllProducts] = useState([]); // 🔥 from Firestore
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract query (?q=dress)
  const params = new URLSearchParams(location.search);
  const query = params.get("q")?.toLowerCase() || "";

  // ✅ Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // 🧠 Normalize product data
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

        setAllProducts(products);
      } catch (error) {
        // console.error("🔥 Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Compute search results
  const searchResults = useMemo(() => {
    return allProducts.filter((p) =>
      [p.title, p.color, p.description, ...(p.tags || [])]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [query, allProducts]);

  // ✅ Handle filter updates
  const handleFilter = useCallback(
    (filtered) => {
      const filteredFromSearch = searchResults.filter((p) =>
        filtered.includes(p)
      );

      setFilteredResults((prev) => {
        const same =
          prev.length === filteredFromSearch.length &&
          prev.every((item) => filteredFromSearch.includes(item));
        return same ? prev : filteredFromSearch;
      });
    },
    [searchResults]
  );

  // ✅ Default: show unfiltered search results initially
  useEffect(() => {
    setFilteredResults(searchResults);
  }, [searchResults]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-lg">
        Searching products...
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center pt-[4vw] text-[#A96A5A] min-h-screen">
      <h1 className="text-3xl font-light uppercase tracking-[0.3vw] mb-6 text-center">
        Search Results for:{" "}
        <span className="mt-3 lg:mt-0 font-semibold">"{query}"</span>
      </h1>

      <Filter products={searchResults} onFilter={handleFilter} />

      <div className="lg:pl-[20vw]">
        {filteredResults.length > 0 ? (
          <Cards cards={filteredResults} layout="grid" />
        ) : (
          <p className="text-lg italic mt-[10vh] opacity-70 text-center">
            No products found for “{query}”
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
