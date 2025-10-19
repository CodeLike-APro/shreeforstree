import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import allProducts from "../data/products.json";
import Cards from "../components/common/Cards";
import Filter from "../components/common/Filter";

const SearchResults = () => {
  const location = useLocation();
  const [filteredResults, setFilteredResults] = useState([]);

  // Extract query string (?q=dress)
  const params = new URLSearchParams(location.search);
  const query = params.get("q")?.toLowerCase() || "";

  // ✅ Memoize search results to avoid re-calculation on every render
  const searchResults = useMemo(() => {
    return allProducts.filter((p) =>
      [p.title, p.color, p.description, ...(p.tags || [])]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [query]);

  // ✅ Handle filter updates safely
  const handleFilter = useCallback(
    (filtered) => {
      const filteredFromSearch = searchResults.filter((p) =>
        filtered.includes(p)
      );

      // 🧠 Prevent unnecessary re-renders
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

  return (
    <div className="relative flex flex-col items-center pt-[4vw] text-[#A96A5A] min-h-screen">
      <h1 className="text-3xl font-light uppercase tracking-[0.3vw] mb-6 text-center">
        Search Results for: <span className="font-semibold">"{query}"</span>
      </h1>

      <Filter products={searchResults} onFilter={handleFilter} />

      <div className="pl-[20vw]">
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
