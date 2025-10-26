import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import allProducts from "../../data/products.json"; // your updated JSON import
import { useCartStore } from "../../store/useCartStore";
import { auth } from "../../firebase";
import { notify } from "./toast";
import Icons from "./../../assets/Icons/Icons";

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
  const location = useLocation();
  const preselectedSize = location.state?.selectedSize || null;
  const [selectedSize, setSelectedSize] = useState(preselectedSize);
  const [quantity, setQuantity] = useState(1); // ✅ NEW
  const zoomRef = useRef(null);
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);

  const mainImageRef = useRef(null);
  const [galleryHeight, setGalleryHeight] = useState(0);

  useEffect(() => {
    if (mainImageRef.current) {
      setGalleryHeight(mainImageRef.current.offsetHeight);
    }

    const handleResize = () => {
      if (mainImageRef.current) {
        setGalleryHeight(mainImageRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      notify.info("Please select a size before adding to cart!");
      return;
    }
    addToCart({ ...product, quantity }, selectedSize); // ✅ pass quantity
    notify.success(`${product.title} (${selectedSize}) added to cart 🛒`);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      notify.info("Please select a size before continuing!");
      return;
    }

    // Add to cart first
    addToCart({ ...product, quantity }, selectedSize);

    // Check auth status
    const user = auth.currentUser;

    if (!user) {
      notify.info("Please sign in to continue checkout.");
      navigate("/login");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row justify-center items-start p-[4vw] gap-[3vw] bg-[#fffaf8]">
      {/* LEFT SIDE — Image + Gallery */}
      {/* LEFT SIDE — Image + Gallery */}
      <div className="flex flex-col lg:flex-row gap-[2vw] w-full lg:w-[60%] justify-center items-start">
        {/* MAIN IMAGE — 1st on mobile, 2nd on desktop */}
        <div
          ref={mainImageRef}
          className="order-1 lg:order-2 relative w-full lg:w-[40vw] h-[50vh] lg:h-[70vh] overflow-hidden rounded-md border border-[#e6d3cb] cursor-pointer"
          onMouseEnter={() => {
            if (window.innerWidth >= 1024) setIsZooming(true);
          }}
          onMouseLeave={() => {
            if (window.innerWidth >= 1024) setIsZooming(false);
          }}
          onMouseMove={(e) => {
            if (window.innerWidth >= 1024) handleMouseMove(e);
          }}
          onClick={() => {
            if (window.innerWidth < 1024) setFullscreen(true);
          }}
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

        {/* GALLERY — 2nd on mobile, 1st on desktop */}
        <div
          className="order-2 lg:order-1 flex lg:flex-col gap-[2vw] lg:gap-[1vw] w-full lg:w-[7vw] items-center justify-center mt-3 lg:py-1 lg:mt-0
              lg:overflow-y-auto lg:scrollbar-thin lg:scrollbar-thumb-[#A96A5A]/60 lg:scrollbar-track-transparent"
          style={{ maxHeight: `${galleryHeight}px` }}
        >
          {product.gallery?.map((img, i) => (
            <div
              key={i}
              className={`cursor-pointer lg:w-[5vw] border-[1.5px] rounded-md overflow-hidden transition-all duration-300 ${
                mainImage === img
                  ? "border-[#A96A5A] scale-105"
                  : "border-transparent hover:border-[#F5D3C3]"
              }`}
              onClick={() => setMainImage(img)}
            >
              <img
                src={img}
                alt={`Product ${i}`}
                className="w-full h-[10vh] lg:h-[5vw] lg:w-[5vw] object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE — Info */}
      <div className="flex flex-col w-full lg:w-[35%] text-[#A96A5A]">
        {/* ✅ Changed category → tags */}

        <div className="flex flex-col">
          {/* Title */}
          <h1 className="order-1 lg:order-2 text-3xl lg:text-4xl font-semibold tracking-wide mb-4">
            {product.title}
          </h1>

          {/* Tags */}
          <div className="order-2 lg:order-1 flex flex-wrap gap-2 mb-3">
            {product.tags
              ?.filter((tag) => tag.toLowerCase() !== "banner") // ✅ filters out banner tag
              .map((tag, i) => (
                <span
                  key={i}
                  className="text-[2.5vw] lg:text-xs uppercase tracking-[0.3vw] lg:tracking-[0.15vw] font-light bg-[#f5d3c3] text-[#A96A5A] px-1 lg:px-2 py-0.5 lg:py-1 rounded-md"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>

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

          <button
            onClick={handleBuyNow}
            className="w-1/2 py-3 uppercase tracking-[0.2vw] bg-[#A96A5A] text-white hover:bg-[#8b5447] transition-all duration-300 rounded-md"
          >
            Buy Now
          </button>
        </div>
      </div>
      {/* FULLSCREEN IMAGE VIEWER (Mobile Only) */}
      {fullscreen && (
        <div className="fixed inset-0 z-[99999] bg-black bg-opacity-95 flex items-center justify-center">
          <img
            src={mainImage}
            alt={product.title}
            className="max-w-full max-h-full object-contain touch-pinch-zoom"
            style={{
              transform: "scale(1)",
              transition: "transform 0.3s ease",
            }}
          />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 z-[100000]"
          >
            <Icons.CloseIcon className="w-8 h-8 text-white hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Product;
