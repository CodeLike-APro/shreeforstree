import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react"; // ✅ add this
import Icons from "../../assets/Icons/Icons";
import Logo from "../../assets/logo/shreeforstree.svg";

const Navbar = () => {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false); // ✅ new state
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
    console.log("Searching for:", searchQuery);
  };

  return (
    <>
      <div className="bg-white fixed h-[7vw] border-b-1 border-black w-full flex items-center justify-between z-[9999]">
        <div className="h-full flex items-center justify-center ml-7">
          <div className="logo h-[7vw] w-[7vw] overflow-hidden mr-7">
            <Link to={"/"}>
              <img
                src={Logo}
                alt="Shree For Stree"
                className="h-[7vw] w-auto"
              />
            </Link>
          </div>
          <div className="quickLinks flex gap-7 uppercase text-[0.9vw] tracking-[2.7px] ">
            <div className="flex gap-7">
              {[
                { name: "all products", path: "/AllProducts" },
                { name: "new arrivals", path: "/NewArrivals" },
                { name: "festive", path: "/Festive" },
                { name: "kurtis", path: "/kurtis" },
                { name: "dresses", path: "/dresses" },
                { name: "categories", path: "/categories" },
                { name: "contact us", path: "/contact" },
              ].map(({ name, path }) => (
                <Link
                  key={name}
                  to={path}
                  className="relative text-[#A96A5A] transition-all duration-200
        after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-[#A96A5A] 
        after:w-0 hover:after:w-full hover:scale-105 after:translate-x-[-50%] 
        after:transition-all after:duration-300 uppercase tracking-[2.7px]"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 🔍 Search / Cart / Account */}
        <div className="h-full flex items-center justify-center mr-7">
          <div className="h-full w-full flex items-center justify-center gap-4 text-[#A96A5A]">
            <div
              className={`relative flex -mr-2 items-center rounded-[0.5vw] pr-2 transition-all duration-300 ${
                searchActive || searchQuery
                  ? "border-[1.5px] border-[#A96A5A] bg-white"
                  : "border-[1.5px] border-transparent bg-transparent"
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchActive(true)}
                onBlur={() => setSearchActive(false)}
                className={`outline-none border-none rounded-[0.5vw] p-1 text-base bg-transparent text-[#A96A5A] transition-all duration-300 ${
                  searchActive || searchQuery
                    ? "w-[15vw] px-3 opacity-100"
                    : "w-0 px-0 opacity-0 cursor-pointer"
                }`}
              />

              {/* Clear button */}
              <div
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="h-full w-[3vw] tracking-[0.1vw] mr-2 flex items-center justify-center"
              >
                <p
                  className={`origin-right transition-all duration-300 cursor-pointer transform ${
                    searchQuery === ""
                      ? "translate-x-2 opacity-0"
                      : "translate-x-0 opacity-100"
                  }`}
                >
                  clear
                </p>
              </div>

              {/* Divider line (only visible when active) */}
              <div
                className={`h-[2.5vw] w-[2px] bg-[#A96A5A] mr-[5px] transition-all duration-300 ${
                  searchActive || searchQuery
                    ? "opacity-100 scale-y-100"
                    : "opacity-0 scale-y-0"
                }`}
              ></div>

              <div className="Search&Close relative">
                <div
                  onClick={() => {
                    inputRef.current?.focus();
                    handleSearch();
                  }}
                  className={`openSearch h-[2vw] w-[2vw] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 ${
                    searchActive && searchQuery === ""
                      ? "opacity-0 scale-0 pointer-events-none"
                      : ""
                  }`}
                >
                  <Icons.SearchIcon
                    size={28}
                    className="text-[#A96A5A] hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <div
                  onClick={() => {
                    setSearchActive(false);
                  }}
                  className={`closeSearch absolute top-0 left-0 h-[2vw] w-[2vw] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 mt-1 ${
                    searchActive && searchQuery === ""
                      ? ""
                      : "opacity-0 scale-0 pointer-events-none"
                  }`}
                >
                  <Icons.CloseIcon
                    size={24}
                    className="text-[#A96A5A] hover:rotate-90 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* 🛒 CART ICON — opens side panel */}
            <div
              onClick={() => setCartOpen(true)} // ✅ opens cart
              className="cart h-[2vw] w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110"
            >
              <Icons.CartIcon
                size={28}
                className="text-[#A96A5A] hover:scale-110 transition-transform duration-200"
              />
            </div>

            {/* 👤 USER ACCOUNT */}
            <div className="userAcc h-[2vw] w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110">
              <Icons.UserIcon
                size={28}
                className="text-[#A96A5A] hover:scale-110 transition-transform duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🧾 CART SIDE PANEL */}
      <AnimatePresence>
        {cartOpen && (
          <>
            {/* Dim background overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-[9998] cursor-pointer"
              onClick={() => setCartOpen(false)} // ✅ closes on outside click
            />

            {/* Cart Panel */}
            <motion.div
              key="cart-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="fixed right-0 top-0 h-full w-[30vw] bg-white shadow-2xl z-[9999] p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl tracking-[0.3vw] uppercase text-[#A96A5A] font-semibold">
                  Your Cart
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="hover:rotate-90 transition-transform duration-300"
                >
                  <Icons.CloseIcon size={26} className="text-[#A96A5A]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto text-[#A96A5A]">
                <p className="text-center italic mt-[40%] opacity-60">
                  Your cart is empty 🛍️
                </p>
              </div>

              <button className="mt-6 w-full bg-[#A96A5A] text-white py-3 uppercase tracking-[0.2vw] rounded-md hover:bg-[#91584b] transition-all duration-300">
                Checkout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
