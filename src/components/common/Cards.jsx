import React, { useRef } from "react";

const Cards = ({ cards }) => {
  const cardRef = useRef(null);
  const imageRefs = useRef([]);
  return (
    <div ref={cardRef} className="flex gap-[1vw] mx-[3vw] flex-nowrap my-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className=" w-[22.75vw] flex flex-col box-border overflow-hidden"
        >
          {/* Image */}
          <div className="imageContainer min-h-[50vh] w-full overflow-hidden">
            <img
              className="object-cover w-full h-full"
              loading="lazy"
              ref={(el) => (imageRefs.current[idx] = el)}
              src={card.img}
              alt={card.title}
            />
          </div>

          {/* Details */}
          <div className="details mx-2 my-1 flex flex-col gap-1 text-sm text-[#3a3a3a]">
            <div className="title text-xl font-semibold uppercase tracking-[0.2vw]">
              {card.title}
            </div>
            <div className="sizes flex flex-wrap gap-1 mt-1">
              {card.sizes.map((size, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[0.7rem] border border-[#AC6B5C] text-[#AC6B5C] rounded-[0.25rem] uppercase font-light hover:bg-[#AC6B5C] hover:text-white transition-all duration-200 cursor-pointer"
                >
                  {size}
                </span>
              ))}
            </div>

            <div className="flex justify-start items-center gap-2 my-1">
              <div
                className={`sale px-2 py-1 text-[1vw] rounded-[0.8vw] text-white bg-[#A96A5A]
                  ${card.sale ? "" : "hidden"}`}
              >
                {card.discount}
              </div>
              <div className="prices">
                <span className=" text-gray-500 mr-2 relative inline-block before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-full before:h-[1.5px] before:bg-gray-500 before:rotate-[-8deg] before:origin-center">
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
  );
};

export default Cards;
