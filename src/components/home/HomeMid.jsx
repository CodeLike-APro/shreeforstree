import React from "react";
import Cards from "../common/Cards";
import PageBreak from "../common/PageBreak";
import Icons from "../../assets/Icons/Icons";

const HomeMid = () => {
  const cards = [
    {
      img: "/NewArrivals/img1.jpg",
      title: "Ivory Silk Gown",
      sale: false,
      discount: "30% OFF",
      wishlist: false,
      category: "Evening Wear",
      originalPrice: "₹8,999",
      currentPrice: "₹6,299",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 4.8,
    },
    {
      img: "/NewArrivals/img2.jpg",
      title: "Blush Pink Lehenga",
      sale: true,
      discount: "30% OFF",
      wishlist: true,
      category: "Bridal",
      originalPrice: "₹12,999",
      currentPrice: "₹22,999",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 5,
    },
    {
      img: "/NewArrivals/img2.jpg",
      title: "Blush Pink Lehenga",
      sale: true,
      discount: "30% OFF",
      wishlist: true,
      category: "Bridal",
      originalPrice: "₹12,999",
      currentPrice: "₹22,999",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 5,
    },
    {
      img: "/NewArrivals/img2.jpg",
      title: "Blush Pink Lehenga ",
      sale: true,
      discount: "30% OFF",
      wishlist: true,
      category: "Bridal",
      originalPrice: "₹12,999",
      currentPrice: "₹22,999",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      ratings: 5,
    },
  ];

  return (
    <div>
      <section>
        <div className="flex flex-col gap-5 my-5">
          <h2 className="w-full flex items-center justify-center text-[#A96A5A] uppercase tracking-[0.5vw] text-[1.5vw] font-extralight">
            Because your dream dress deserves to be real
          </h2>
          <h3 className="w-full flex items-center justify-center text-[#A96A5A] uppercase tracking-[0.5vw] text-[1.2vw] font-light">
            customize with us on Instagram
          </h3>
          <h3 className="w-full flex items-center justify-center text-[#A96A5A] uppercase tracking-[0.5vw] text-[1.2vw] font-ligh gap-4">
            {/* Instagram Icon */}
            <a
              href="https://www.instagram.com/shreeforstree?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icons.InstaIcon size={60} className="mt-3" />
            </a>
            {/* Instagram wordmark */}
            <a
              className="relative after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-[#A96A5A] 
                 after:w-0 hover:after:w-full after:translate-x-[-50%] after:transition-all after:duration-200"
              href="https://www.instagram.com/shreeforstree?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icons.InstaID size="60" className="h-24 w-75" />
            </a>
          </h3>
        </div>
        <div className="w-full flex items-center justify-center mt-[5vw]">
          <h1 className="h-full text-4xl uppercase text-[#AC6B5C] tracking-[0.5vw] font-light">
            new arrivals
          </h1>
        </div>
        <div className="mt-[10vh] mb-[7vh]">
          <Cards cards={cards} layout="flex" />
        </div>

        <div className="shop w-full my-2 py-2 flex items-center justify-center z-[9999]">
          <h2
            className="relative text-xl uppercase font-light text-center text-[#AC6B5C] tracking-[0.25vw] border border-[#AC6B5C] py-2.5 px-3 cursor-pointer overflow-hidden
             transition-all duration-200 ease-in-out group rounded-[0.5vw] z-20"
          >
            <span className="relative z-[9999] group-hover:text-white transition-colors duration-200">
              shop now
            </span>
            <span className="absolute inset-0 bg-[#AC6B5C] scale-x-0 origin-center transition-transform duration-200 ease-out group-hover:scale-x-100 z-10"></span>
          </h2>
        </div>
      </section>
      <div className="pageBreak">
        <PageBreak />
      </div>
      <section>
        <div className="w-full flex items-center justify-center">
          <h1 className="h-full text-4xl uppercase text-[#AC6B5C] tracking-[0.7vw] font-light">
            festive
          </h1>
        </div>
        <div className="mt-[10vh] mb-[7vh]">
          <Cards cards={cards} layout="flex" />
        </div>
        <div className="view w-full my-2 py-2 flex items-center justify-center z-[9999]">
          <h2
            className="relative text-xl uppercase font-light text-center text-[#AC6B5C] tracking-[0.25vw] border border-[#AC6B5C] p-2.5 cursor-pointer overflow-hidden
             transition-all duration-200 ease-in-out group rounded-[0.5vw] z-20"
          >
            <span className="relative z-[9999] group-hover:text-white transition-colors duration-200">
              view all
            </span>
            <span className="absolute inset-0 bg-[#AC6B5C] scale-x-0 origin-center transition-transform duration-200 ease-out group-hover:scale-x-100 z-10"></span>
          </h2>
        </div>
      </section>
    </div>
  );
};

export default HomeMid;
