import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import allProducts from "../../data/products.json";

const Cards = ({ layout = "row", filterTag, cards: passedCards = [] }) => {
  const [cards, setCards] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (Array.isArray(passedCards) && passedCards.length > 0) {
      setCards(passedCards);
      return;
    }
    // ... your filtering logic (unchanged)
    let filteredProducts = [...allProducts];
    // (keep your existing filter code)
    setCards(filteredProducts);
  }, [passedCards, filterTag, location.pathname]);

  const layoutClasses =
    layout === "grid"
      ? "grid grid-cols-2  lg:grid-cols-3 gap-2 justify-items-center"
      : layout === "flex"
      ? "flex flex-nowrap gap-6 overflow-x-auto no-scrollbar pl-2"
      : "flex flex-wrap gap-6 justify-center";

  const handleCardClick = (card) => {
    // navigate to product page WITHOUT preselected size
    navigate(`/product/${card.id}`);
  };

  const handleSizeClick = (e, card, size) => {
    // prevent bubbling to card click
    e.stopPropagation();
    // navigate to product page WITH selectedSize passed in state
    navigate(`/product/${card.id}`, { state: { selectedSize: size } });
  };

  return (
    <div className={layoutClasses}>
      {cards.length === 0 ? (
        <p className="text-[#A96A5A] text-lg italic">No products found.</p>
      ) : (
        cards.map((card, i) => (
          <div
            key={`${card.id}-${i}`}
            onClick={() => handleCardClick(card)}
            className={`${
              layout === "grid"
                ? "w-[48vw] h-[100vw] lg:w-[22vw] lg:h-[35vw]" // 🧩 for grid layout
                : "min-w-[85vw] max-w-[85vw] lg:min-w-[22.5vw] lg:max-w-[22.5vw]" // 🧩 for flex layout
            } flex flex-col bg-white transition-all duration-300 overflow-hidden cursor-pointer group`}
          >
            <div className="imageContainer w-full h-[55vh] overflow-hidden">
              <img
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
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
                <div className="ratings text-yellow-500">⭐ {card.ratings}</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Cards;
