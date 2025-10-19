import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import allProducts from "../../data/products.json"; // your updated JSON import
import { useCartStore } from "../../store/useCartStore";

const Product = () => {
  const { id } = useParams();
  const product = allProducts.find((item) => item.id === id);
  const { addToCart } = useCartStore();

  if (!product) {
    return (
      <div className="h-screen flex items-center justify-center text-[#A96A5A] text-2xl">
        Product not found.
      </div>
    );
  }

  const [mainImage, setMainImage] = useState(product.img);
  const [isZooming, setIsZooming] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1); // ✅ NEW
  const zoomRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!zoomRef.current) return;

    const { left, top, width, height } =
      zoomRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;

    zoomRef.current.style.transformOrigin = `${x}% ${y}%`;
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size before adding to cart!");
      return;
    }
    addToCart({ ...product, quantity }, selectedSize); // ✅ pass quantity
    alert(`${product.title} (${selectedSize}) added to cart 🛒`);
  };
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row justify-center items-start p-[4vw] gap-[3vw] bg-[#fffaf8]">
      {/* LEFT SIDE — Gallery */}
      <div className="flex flex-col md:flex-row gap-[2vw] w-full md:w-[60%] justify-center items-start">
        <div className="flex md:flex-col gap-[1vw] w-full md:w-[10vw] justify-center">
          {product.gallery?.map((img, i) => (
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

        {/* ZOOMABLE MAIN IMAGE */}
        <div
          className="relative w-full md:w-[40vw] h-[50vh] md:h-[70vh] overflow-hidden rounded-md border border-[#e6d3cb] cursor-zoom-in"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
        >
          <img
            ref={zoomRef}
            src={mainImage}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isZooming ? "scale-250" : "scale-100"
            }`}
          />
        </div>
      </div>

      {/* RIGHT SIDE — Info */}
      <div className="flex flex-col w-full md:w-[35%] text-[#A96A5A]">
        {/* ✅ Changed category → tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {product.tags?.map((tag, i) => (
            <span
              key={i}
              className="text-xs uppercase tracking-[0.15vw] font-light bg-[#f5d3c3] text-[#A96A5A] px-2 py-1 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-wide mb-4">
          {product.title}
        </h1>

        <p className="text-lg font-light text-[#8b5447] mb-4">
          {product.currentPrice}
          <span className="text-gray-400 line-through ml-2">
            {product.originalPrice}
          </span>
        </p>

        <p className="text-sm text-[#9c7e73] mb-6 leading-relaxed">
          {product.description}
        </p>

        {/* Sizes */}
        <div className="mb-6">
          <h4 className="text-sm uppercase tracking-[0.2vw] mb-2 font-medium">
            Select Size
          </h4>
          <div className="flex flex-wrap gap-3">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`border px-4 py-2 text-sm rounded-md transition-all duration-300 ${
                  selectedSize === size
                    ? "bg-[#A96A5A] text-white border-[#A96A5A]"
                    : "border-[#A96A5A] text-[#A96A5A] hover:bg-[#A96A5A] hover:text-white"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mb-6 mt-4">
          <h4 className="text-sm uppercase tracking-[0.2vw] mb-2 font-medium">
            Quantity
          </h4>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 flex items-center justify-center border border-[#A96A5A] text-[#A96A5A] rounded-md hover:bg-[#A96A5A] hover:text-white transition-all duration-200"
            >
              −
            </button>
            <span className="text-lg font-medium w-6 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((prev) => prev + 1)}
              className="w-8 h-8 flex items-center justify-center border border-[#A96A5A] text-[#A96A5A] rounded-md hover:bg-[#A96A5A] hover:text-white transition-all duration-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleAddToCart}
            className="w-1/2 py-3 uppercase tracking-[0.2vw] border border-[#A96A5A] text-[#A96A5A] hover:bg-[#A96A5A] hover:text-white transition-all duration-300 rounded-md"
          >
            Add to Cart
          </button>

          <button className="w-1/2 py-3 uppercase tracking-[0.2vw] bg-[#A96A5A] text-white hover:bg-[#8b5447] transition-all duration-300 rounded-md">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
