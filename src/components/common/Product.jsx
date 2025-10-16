import React, { useState, useRef } from "react";

const Product = () => {
  const images = [
    "/products/img1.jpg",
    "/products/img2.jpg",
    "/products/img3.jpg",
    "/products/img4.jpg",
  ];

  const [mainImage, setMainImage] = useState(images[0]);
  const zoomRef = useRef(null);

  // 🧲 Zoom on hover logic
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    zoomRef.current.style.backgroundPosition = `${x}% ${y}%`;
  };

  const handleMouseEnter = (img) => {
    zoomRef.current.style.backgroundImage = `url(${img})`;
    zoomRef.current.style.display = "block";
  };

  const handleMouseLeave = () => {
    zoomRef.current.style.display = "none";
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row justify-center items-start p-[4vw] gap-[3vw] bg-[#fffaf8]">
      {/* 🔹 LEFT SECTION — Gallery + Main Image */}
      <div className="flex flex-col md:flex-row gap-[2vw] w-full md:w-[60%] justify-center items-start">
        {/* Thumbnail Gallery */}
        <div className="flex md:flex-col gap-[1vw] w-full md:w-[10vw] justify-center">
          {images.map((img, i) => (
            <div
              key={i}
              className={`cursor-pointer border-[1.5px] rounded-md overflow-hidden transition-all duration-300 ${
                mainImage === img
                  ? "border-[#A96A5A] scale-105"
                  : "border-transparent hover:border-[#A96A5A]"
              }`}
              onMouseEnter={() => setMainImage(img)}
            >
              <img
                src={img}
                alt={`Product ${i}`}
                className="w-full h-[10vh] md:h-[10vw] object-cover"
              />
            </div>
          ))}
        </div>

        {/* Main Image */}
        <div
          className="relative w-full md:w-[40vw] h-[50vh] md:h-[70vh] overflow-hidden rounded-md border border-[#e6d3cb] cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => handleMouseEnter(mainImage)}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={mainImage}
            alt="Main product"
            className="w-full h-full object-cover"
          />
          {/* Zoom Lens */}
          <div
            ref={zoomRef}
            className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-cover scale-150 z-10 pointer-events-none hidden"
            style={{
              backgroundImage: `url(${mainImage})`,
            }}
          ></div>
        </div>
      </div>

      {/* 🔹 RIGHT SECTION — Product Info */}
      <div className="flex flex-col w-full md:w-[35%] text-[#A96A5A]">
        <h3 className="text-sm uppercase tracking-[0.3vw] font-light mb-2">
          Evening Wear
        </h3>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-wide mb-4">
          Ivory Silk Gown
        </h1>
        <p className="text-lg font-light text-[#8b5447] mb-4">
          ₹6,299 <span className="text-gray-400 line-through ml-2">₹8,999</span>
        </p>

        <p className="text-sm text-[#9c7e73] mb-6 leading-relaxed">
          Elevate your evening with this graceful ivory silk gown featuring
          premium fabric, intricate handwork, and a tailored silhouette designed
          for timeless elegance.
        </p>

        {/* Sizes */}
        <div className="mb-6">
          <h4 className="text-sm uppercase tracking-[0.2vw] mb-2 font-medium">
            Select Size
          </h4>
          <div className="flex flex-wrap gap-3">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                className="border border-[#A96A5A] px-4 py-2 text-sm rounded-md hover:bg-[#A96A5A] hover:text-white transition-all duration-300"
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart & Buy Now */}
        <div className="flex gap-4 mt-4">
          <button className="w-1/2 py-3 uppercase tracking-[0.2vw] border border-[#A96A5A] text-[#A96A5A] hover:bg-[#A96A5A] hover:text-white transition-all duration-300 rounded-md">
            Add to Cart
          </button>
          <button className="w-1/2 py-3 uppercase tracking-[0.2vw] bg-[#A96A5A] text-white hover:bg-[#8b5447] transition-all duration-300 rounded-md">
            Buy Now
          </button>
        </div>

        {/* Guarantee line */}
        <div className="text-xs italic mt-6 text-gray-500 tracking-wide">
          Free shipping · Easy returns within 7 days
        </div>
      </div>
    </div>
  );
};

export default Product;
