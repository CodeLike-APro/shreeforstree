import React, { useCallback, useState } from "react";
import Filter from "../components/common/Filter";
import Cards from "../components/common/Cards";

const Dresses = () => {
  const dresses = [
    {
      img: "/NewArrivals/img1.jpg",
      title: "Ivory Silk Gown",
      sale: false,
      discount: "30% OFF",
      wishlist: false,
      category: "Evening Wear",
      color: "Red",
      originalPrice: "₹8,999",
      currentPrice: "₹6,299",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 4.8,
    },
    {
      img: "/NewArrivals/img1.jpg",
      title: "Ivory Silk Gown",
      sale: false,
      discount: "30% OFF",
      wishlist: false,
      category: "Evening Wear",
      color: "Red",
      originalPrice: "₹8,999",
      currentPrice: "₹6,299",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 4.8,
    },
    {
      img: "/NewArrivals/img1.jpg",
      title: "Ivory Silk Gown",
      sale: false,
      discount: "30% OFF",
      wishlist: false,
      category: "Party Wear",
      color: "Pink",
      originalPrice: "₹8,999",
      currentPrice: "₹6,299",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 4.8,
    },
    {
      img: "/NewArrivals/img1.jpg",
      title: "Ivory Silk Gown",
      sale: false,
      discount: "30% OFF",
      wishlist: false,
      category: "Night Wear",
      color: "Violet",
      originalPrice: "₹8,999",
      currentPrice: "₹6,299",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 4.8,
    },
    {
      img: "/NewArrivals/img1.jpg",
      title: "Ivory Silk Gown",
      sale: false,
      discount: "30% OFF",
      wishlist: false,
      category: "Bridal",
      color: "Blue",
      originalPrice: "₹8,999",
      currentPrice: "₹6,299",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 4.8,
    },
  ];

  const [filteredProducts, setFilteredProducts] = useState(dresses);

  // ✅ Prevent re-creation on each render (main cause of infinite loop)
  const handleFilter = useCallback((filtered) => {
    setFilteredProducts(filtered);
  }, []);

  return (
    <div className="min-h-screen right-0 flex flex-col items-center pt-[3vw] pl-[20vw]">
      <Filter products={dresses} onFilter={handleFilter} />
      <Cards cards={filteredProducts} layout="grid" />
    </div>
  );
};

export default Dresses;
