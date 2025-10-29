import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Cards = ({ layout = "row", filterTag, cards: passedCards = [] }) => {
  // console.log("🧩 Cards received:", passedCards);
  const [cards, setCards] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Array.isArray(passedCards)) return;

    // ✅ Safe filtering
    const filtered = passedCards.filter((item) => {
      if (!item?.tags || !Array.isArray(item.tags)) return true; // keep if tags missing
      return !item.tags.some((tag) => tag?.toLowerCase() === "banner");
    });

    // ✅ If nothing passed through filter (avoid empty render)
    setCards(filtered.length > 0 ? filtered : passedCards);
  }, [passedCards, filterTag, location.pathname]);

  // ✅ Layout options
  const layoutClasses =
    layout === "grid"
      ? "grid grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center"
      : layout === "flex"
      ? "flex flex-nowrap gap-6 overflow-x-auto no-scrollbar pl-2"
      : "flex flex-wrap gap-6 justify-center";

  // ✅ Navigation
  const handleCardClick = (card) => {
    navigate(`/product/${card.id}`);
  };

  const handleSizeClick = (e, card, size) => {
    e.stopPropagation();
    navigate(`/product/${card.id}`, { state: { selectedSize: size } });
  };

  // ✅ Render
  if (!cards) {
    return <div>Cards is undefined</div>;
  }

  if (Array.isArray(cards) && cards.length === 0) {
    // console.log("✅ Cards array empty, showing placeholder");
    return <div>Loaded but no items found</div>;
  }

  return (
    <div className={layoutClasses}>
      {cards.map((card, i) => (
        <div
          key={`${card.id}-${i}`}
          onClick={() => handleCardClick(card)}
          className={`${
            layout === "grid"
              ? "w-[48vw] h-[100vw] lg:w-[22vw] lg:h-[35vw]"
              : "min-w-[85vw] max-w-[85vw] lg:min-w-[22.5vw] lg:max-w-[22.5vw]"
          } flex flex-col bg-white transition-all duration-300 overflow-hidden cursor-pointer group border border-[#e6d3cb] rounded-md`}
        >
          {/* 🖼️ Product Image */}
          <div className="imageContainer w-full h-[55vh] overflow-hidden bg-[#f9f4f2]">
            <img
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              src={card.img || "/fallback-user-icon.svg"}
              alt={card.title || "Product"}
              loading="lazy"
              onError={(e) => (e.target.src = "/fallback-user-icon.svg")}
            />
          </div>

          {/* 📦 Product Info */}
          <div className="p-3 flex flex-col gap-2 text-[#3a3a3a]">
            <div className="title text-lg lg:text-xl font-semibold uppercase tracking-[0.2vw] truncate">
              {card.title}
            </div>

            {/* Sizes */}
            {Array.isArray(card.sizes) && card.sizes.length > 0 && (
              <div className="sizes flex flex-wrap gap-1">
                {card.sizes.map((size, j) => (
                  <button
                    key={j}
                    onClick={(e) => handleSizeClick(e, card, size)}
                    className="px-2 py-0.5 text-[0.7rem] border border-[#AC6B5C] text-[#AC6B5C] rounded-[0.25rem] uppercase font-light hover:bg-[#AC6B5C] hover:text-white transition-all duration-200"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            {/* Pricing */}
            <div className="flex justify-start items-center gap-2">
              <div className="prices text-sm">
                <span className="font-bold text-[#A96A5A]">
                  ₹{card.currentPrice || card.price || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cards;
