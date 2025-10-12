import React, { useRef } from "react";

const Cards = ({ cards }) => {
  const cardRef = useRef(null);
  const imageRefs = useRef([]);
  return (
    <div className="">
      <div ref={cardRef} className="flex gap-[1vw] mx-[3vw] flex-wrap my-5">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="h-[60vh] w-[22.75vw] flex flex-col box-border border-2 border-black overflow-hidden"
          >
            {/* Image */}
            <div className="imageContainer h-[50vh] w-full overflow-hidden">
              <img
                className="object-cover w-full h-full"
                ref={(el) => (imageRefs.current[idx] = el)}
                src={card.img}
                alt={card.title}
              />
            </div>

            {/* Details */}
            <div className="details px-2 py-1 flex flex-col gap-1 text-sm text-[#3a3a3a]">
              <div className="title font-semibold uppercase">{card.title}</div>
              <div className="category text-xs italic">{card.category}</div>
              <div className="sale text-[#A96A5A]">{card.sale}</div>

              <div className="flex justify-between items-center">
                <div className="prices">
                  <span className="line-through text-gray-500 mr-2">
                    {card.originalPrice}
                  </span>
                  <span className="font-bold text-[#A96A5A]">
                    {card.currentPrice}
                  </span>
                </div>
                <div className="ratings text-yellow-500">⭐ {card.ratings}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
