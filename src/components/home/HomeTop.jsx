import React, { useEffect, useState } from "react";
import Slider from "../common/Slider";
import products from "../../data/products.json"; // ✅ Import products.json directly

const HomeTop = () => {
  const [bannerProducts, setBannerProducts] = useState([]);

  useEffect(() => {
    const filtered = products.filter((p) =>
      p.tags?.some((tag) => tag.toLowerCase() === "banner")
    );
    setBannerProducts(filtered);
  }, []);

  return (
    <div className="p-4 flex flex-col justify-center items-center overflow-hidden select-none">
      <Slider slides={bannerProducts} />
    </div>
  );
};

export default HomeTop;
