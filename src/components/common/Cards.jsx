import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import allProducts from "../../data/products.json";

const Cards = ({ layout = "row", filterTag, cards: passedCards = [] }) => {
  const [cards, setCards] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (Array.isArray(passedCards) && passedCards.length > 0) {
      setCards(passedCards);
      return;
    }

    let filteredProducts = [...allProducts];

    if (filterTag) {
      filteredProducts = filteredProducts.filter((p) =>
        p.tags?.some(
          (tag) => tag.toLowerCase().trim() === filterTag.toLowerCase().trim()
        )
      );
    } else if (location.pathname.toLowerCase().includes("allproducts")) {
      filteredProducts = allProducts;
    } else if (location.pathname.toLowerCase().includes("new-arrivals")) {
      filteredProducts = allProducts.filter((p) =>
        p.tags?.some((tag) => tag.toLowerCase().trim() === "newarrival")
      );
    } else if (location.pathname.toLowerCase().includes("festive")) {
      filteredProducts = allProducts.filter((p) =>
        p.tags?.some((tag) => tag.toLowerCase().trim() === "festive")
      );
    } else if (location.pathname.toLowerCase().includes("kurtis")) {
      filteredProducts = allProducts.filter((p) =>
        p.tags?.some((tag) => tag.toLowerCase().trim() === "kurtis")
      );
    }

    setCards(filteredProducts);
  }, [passedCards, filterTag, location.pathname]);

  const layoutClasses =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 justify-items-center"
      : layout === "flex"
      ? "flex flex-nowrap gap-6 overflow-x-auto no-scrollbar pl-2"
      : "flex flex-wrap gap-6 justify-center";

  return (
    <div className={layoutClasses}>
      {cards.length === 0 ? (
        <p className="text-[#A96A5A] text-lg italic">No products found.</p>
      ) : (
        cards.map((card, i) => (
          <Link to={`/product/${card.id}`} key={`${card.id}-${i}`}>
            <div className="min-w-[22.5vw] max-w-[22.5vw] flex flex-col bg-white transition-all duration-300 overflow-hidden cursor-pointer">
              <div className="imageContainer w-full h-[55vh] overflow-hidden">
                <img
                  className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                  src={card.img}
                  alt={card.title}
                  loading="lazy"
                />
              </div>

              <div className="p-3 flex flex-col gap-2 text-[#3a3a3a]">
                <div className="title text-xl font-semibold uppercase tracking-[0.2vw]">
                  {card.title}
                </div>

                {card.sizes && (
                  <div className="sizes flex flex-wrap gap-1">
                    {card.sizes.map((size, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[0.7rem] border border-[#AC6B5C] text-[#AC6B5C] rounded-[0.25rem] uppercase font-light hover:bg-[#AC6B5C] hover:text-white transition-all duration-200 cursor-pointer"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-start items-center gap-2">
                  {card.sale && (
                    <div className="sale px-2 py-1 text-sm rounded-[0.8vw] text-white bg-[#A96A5A]">
                      {card.discount}
                    </div>
                  )}
                  <div className="prices text-sm">
                    {card.originalPrice && (
                      <span className="text-gray-500 mr-2 line-through">
                        {card.originalPrice}
                      </span>
                    )}
                    <span className="font-bold text-[#A96A5A]">
                      {card.currentPrice}
                    </span>
                  </div>
                </div>

                {card.ratings && (
                  <div className="ratings text-yellow-500">
                    ⭐ {card.ratings}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default Cards;
