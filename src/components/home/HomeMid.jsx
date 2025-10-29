import React, { useEffect, useState } from "react";
import Cards from "../common/Cards";
import PageBreak from "../common/PageBreak";
import Icons from "../../assets/Icons/Icons";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

// 🔥 Utility: normalize tag text for consistent matching
const normalizeTag = (tag) =>
  tag
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const HomeMid = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [festive, setFestive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Query both "newarrival" and "festive" tagged products
        const productsSnapshot = await getDocs(collection(db, "products"));

        const products = productsSnapshot.docs.map((doc) => {
          const data = doc.data();

          // Safely extract prices and fallback to 0 if missing
          const currentPrice =
            typeof data.currentPrice === "string"
              ? data.currentPrice
              : data.currentPrice?.toString() || data.price?.toString() || "0";

          return {
            id: doc.id,
            title: data.title || "Untitled Product",
            description: data.description || "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            color: data.color || "",
            price:
              typeof data.price === "string"
                ? data.price
                : data.price?.toString() || "0",
            currentPrice:
              typeof data.currentPrice === "string"
                ? data.currentPrice
                : data.currentPrice?.toString() ||
                  data.price?.toString() ||
                  "0",
            img:
              data.img ||
              (Array.isArray(data.images) && data.images.length > 0
                ? data.images[0]
                : "/fallback-user-icon.svg"),
          };
        });

        // Filter dynamically based on tags
        const filteredNewArrivals = products
          .filter(
            (p) =>
              Array.isArray(p.tags) &&
              p.tags.some((tag) => normalizeTag(tag).includes("newarrival"))
          )
          .slice(0, 6);

        const filteredFestive = products
          .filter(
            (p) =>
              Array.isArray(p.tags) &&
              p.tags.some((tag) => normalizeTag(tag).includes("festive"))
          )
          .slice(0, 6);

        setNewArrivals(filteredNewArrivals);
        setFestive(filteredFestive);
      } catch (error) {
        // console.error("🔥 Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      {/* ✨ Instagram Section */}
      <section className="mb-[8vw] lg:mb-0">
        <div className="flex flex-col gap-3 lg:gap-5 mt-3 lg:my-5">
          <h2 className="w-full flex text-center items-center justify-center text-[#A96A5A] uppercase tracking-[0.5vw] text-[4vw] lg:text-[1.5vw] font-extrabold lg:font-extralight">
            Because your dream dress deserves to be real
          </h2>
          <h3 className="w-full flex items-center justify-center text-[#A96A5A] uppercase tracking-[0.5vw] text-[2.5vw] lg:text-[1.2vw] font-bold lg:font-light">
            customize with us on Instagram
          </h3>
          <h3 className="w-full flex items-center justify-center text-[#A96A5A] uppercase tracking-[0.5vw] text-[1.2vw] font-light gap-4 my-2 lg:my-0">
            <a
              href="https://www.instagram.com/shreeforstree"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icons.InstaIcon className="mt-3 h-[35px] lg:h-[60px] w-[35px] lg:w-[60px]" />
            </a>
            <a
              className="relative after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-[#A96A5A] 
                 after:w-0 hover:after:w-full after:translate-x-[-50%] after:transition-all after:duration-200"
              href="https://www.instagram.com/shreeforstree"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icons.InstaID className="h-[50px] w-[150px] lg:h-[100px] lg:w-[300px]" />
            </a>
          </h3>
        </div>

        {/* 🆕 New Arrivals */}
        <div className="w-full flex items-center justify-center mt-[10vw] lg:mt-[5vw]">
          <h1 className="h-full text-4xl uppercase text-[#AC6B5C] tracking-[1.5vw] lg:tracking-[0.5vw] font-light">
            new arrivals
          </h1>
        </div>

        {loading ? (
          <p className="text-center text-[#A96A5A] italic my-6">
            Loading new arrivals...
          </p>
        ) : (
          <>
            <div className="mt-[7vh] lg:mt-[10vh] mb-[3vh] lg:mb-[7vh] pl-[3vw]">
              <Cards cards={newArrivals} layout="flex" />
            </div>

            <div className="shop w-full my-2 py-2 flex items-center justify-center z-[9999]">
              <h2
                className="relative text-xl uppercase font-light text-center text-[#AC6B5C] tracking-[0.25vw] border border-[#AC6B5C] py-2.5 px-3 cursor-pointer overflow-hidden
               transition-all duration-200 ease-in-out group rounded-[0.5vw] z-20"
              >
                <Link to={"/NewArrivals"}>
                  <span className="relative z-[9999] group-hover:text-white transition-colors duration-200">
                    shop now
                  </span>
                </Link>
                <span className="absolute inset-0 bg-[#AC6B5C] scale-x-0 origin-center transition-transform duration-200 ease-out group-hover:scale-x-100 z-10"></span>
              </h2>
            </div>
          </>
        )}
      </section>

      {/* 🧩 Page Break */}
      <div className="pageBreak hidden lg:block">
        <PageBreak />
      </div>

      {/* 🎉 Festive Section */}
      <section>
        <div className="w-full flex items-center justify-center">
          <h1 className="h-full text-4xl uppercase text-[#AC6B5C] tracking-[1.5vw] lg:tracking-[0.7vw] font-light">
            festive
          </h1>
        </div>

        {loading ? (
          <p className="text-center text-[#A96A5A] italic my-6">
            Loading festive collection...
          </p>
        ) : (
          <>
            <div className="mt-[7vh] lg:mt-[10vh] mb-[3vh] lg:mb-[7vh] pl-[3vw]">
              <Cards cards={festive} layout="flex" />
            </div>

            <div className="view w-full my-2 py-2 flex items-center justify-center z-[9999]">
              <h2
                className="relative text-xl uppercase font-light text-center text-[#AC6B5C] tracking-[0.25vw] border border-[#AC6B5C] p-2.5 cursor-pointer overflow-hidden
               transition-all duration-200 ease-in-out group rounded-[0.5vw] z-20"
              >
                <Link to={"/Festive"}>
                  <span className="relative z-[9999] group-hover:text-white transition-colors duration-200">
                    view all
                  </span>
                </Link>
                <span className="absolute inset-0 bg-[#AC6B5C] scale-x-0 origin-center transition-transform duration-200 ease-out group-hover:scale-x-100 z-10"></span>
              </h2>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default HomeMid;
