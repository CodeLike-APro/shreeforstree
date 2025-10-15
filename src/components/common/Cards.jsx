import React from "react";

const Cards = ({ cards }) => {
  return (
    <section className="relative w-full h-auto my-[5vh] px-[5vh] scrollbar-hide">
      <div className="flex gap-[1vw] px-1 py-[1vh] overflow-x-scroll items-start scrollbar-hide">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="w-[22.5vw] flex-shrink-0 flex flex-col bg-white scroll-smooth h-auto"
          >
            {/* Image */}
            <div className="imageContainer w-full h-[50vh] overflow-hidden">
              <img
                className="object-cover w-full h-full"
                src={card.img}
                alt={card.title}
              />
            </div>

            {/* Details */}
            <div className="p-3 flex flex-col gap-2 text-[#3a3a3a]">
              <div className="title text-xl font-semibold uppercase tracking-[0.2vw]">
                {card.title}
              </div>

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

              <div className="flex justify-start items-center gap-2">
                {card.sale && (
                  <div className="sale px-2 py-1 text-sm rounded-[0.8vw] text-white bg-[#A96A5A]">
                    {card.discount}
                  </div>
                )}
                <div className="prices text-sm">
                  <span className="text-gray-500 mr-2 line-through">
                    {card.originalPrice}
                  </span>
                  <span className="font-bold text-[#A96A5A]">
                    {card.currentPrice}
                  </span>
                </div>
              </div>

              <div className="ratings text-yellow-500">⭐ {card.ratings}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Cards;
