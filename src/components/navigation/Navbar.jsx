import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // <-- add useNavigate here
import { motion, AnimatePresence } from "motion/react"; // ✅ add this
import Icons from "../../assets/Icons/Icons";
import Logo from "../../assets/logo/shreeforstree.svg";
import { useStore } from "../../store/useStore";
import { useCartStore } from "../../store/useCartStore";
import { auth } from "../../firebase"; // make sure this exists
import { onAuthStateChanged, signOut } from "firebase/auth";

const Navbar = () => {
  const [searchActive, setSearchActive] = useState(false);
  const { searchQuery, setSearchQuery } = useStore();
  const [cartOpen, setCartOpen] = useState(false); // ✅ new state
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart } = useCartStore();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [tempQuery, setTempQuery] = useState(searchQuery);
  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(tempQuery), 300);
    return () => clearTimeout(timeout);
  }, [tempQuery]);

  const handleSearch = (e) => {
    if (!tempQuery.trim()) return; // ignore empty input

    // handle both keyboard + click
    if (!e || e.key === "Enter" || e.type === "click") {
      navigate(`/search?q=${encodeURIComponent(tempQuery.trim())}`);
      setSearchActive(false);
    }
  };
  // console.log("Searching for:", tempQuery);

  return (
    <>
      <div
        id="NavBar"
        className="bg-white fixed top-0 left-0 right-0 h-[16vw] lg:h-[7vw] border-b border-black w-full flex items-center justify-between z-[9999] transition-none will-change-transform"
      >
        <div className="h-full flex items-center justify-start lg:ml-7 ">
          <div className="logo h-[14vw] w-[14vw] lg:h-[7vw] lg:w-[7vw] overflow-hidden lg:mr-7">
            <Link to={"/"}>
              <img
                src={Logo}
                alt="Shree For Stree"
                className="h-[14vw] lg:h-[7vw] w-auto"
              />
            </Link>
          </div>
          <div className="quickLinks hidden lg:flex gap-7 uppercase text-[0.9vw] tracking-[2.7px] ">
            <div className="flex gap-7">
              {[
                { name: "all products", path: "/AllProducts" },
                { name: "new arrivals", path: "/NewArrivals" },
                { name: "festive", path: "/Festive" },
                { name: "kurties", path: "/kurties" },
                { name: "dresses", path: "/dresses" },
                { name: "categories", path: "/categories" },
                { name: "contact us", path: "/contact" },
              ].map(({ name, path }) => (
                <Link
                  key={name}
                  to={path}
                  className="relative text-[#b17362] hover:text-[#8e5546] transition-all duration-200
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
        <div className="h-full flex items-center justify-end mr-2 lg:mr-7">
          <div className="flex items-center gap-2 lg:gap-4 text-[#b17362] hover:text-[#8e5546]">
            <div
              className={`relative h-[9vw] lg:h-auto flex -mr-2 items-center rounded-[1.5vw] lg:rounded-[0.5vw] pr-2 transition-all duration-300 ${
                searchActive || searchQuery
                  ? "border-[1.5px] border-[#A96A5A] bg-white"
                  : "border-[1.5px] border-[#F5D3C3] lg:border-transparent bg-transparent"
              }`}
            >
              {/* ---- Autofill traps (off-screen, not display:none) ---- */}
              <input
                type="text"
                name="fakeusernameremembered"
                autoComplete="username"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
                tabIndex={-1}
              />
              <input
                type="password"
                name="fakepasswordremembered"
                autoComplete="new-password"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
                tabIndex={-1}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={tempQuery}
                autoComplete="off"
                name="siteSearch"
                onChange={(e) => setTempQuery(e.target.value)}
                onKeyDown={handleSearch} // ✅ Trigger on Enter
                onFocus={() => setSearchActive(true)}
                onBlur={() => setSearchActive(false)}
                className={`outline-none border-none rounded-[0.5vw] p-1 text-base bg-transparent text-[#b17362] hover:text-[#8e5546] transition-all duration-300${
                  searchActive || tempQuery
                    ? "lg:w-[15vw] lg:px-3 lg:opacity-100 w-full px-3 opacity-100"
                    : "lg:w-0 lg:px-0 lg:opacity-0 lg:cursor-pointer w-full px-3 opacity-100"
                }`}
              />

              {/* Clear button */}
              <div
                onClick={() => {
                  setTempQuery(""); // ✅ clears local input field
                  setSearchQuery(""); // ✅ clears Zustand state
                  inputRef.current?.focus();
                }}
                className="h-full w-[3vw] tracking-[0.1vw] ml-2 lg:ml-0 mr-5 lg:mr-2 flex items-center justify-center"
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
                className={`h-[9vw] lg:h-[2.5vw] w-[2px] mr-[5px] transition-all duration-300 ${
                  searchActive || searchQuery
                    ? "lg:opacity-100 lg:scale-y-100 bg-[#A96A5A]"
                    : "lg:opacity-0 lg:scale-y-0 bg-[#F5D3C3]"
                }`}
              ></div>

              <div className="Search&Close relative">
                <div
                  onClick={(e) => {
                    inputRef.current?.focus();
                    handleSearch(e);
                  }}
                  className={`openSearch lg:h-[2vw] lg:w-[2vw] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 ${
                    searchActive && searchQuery === ""
                      ? "opacity-0 scale-0 pointer-events-none"
                      : ""
                  }`}
                >
                  <Icons.SearchIcon className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200" />
                </div>
                <div
                  onClick={handleSearch} // ✅ triggers redirect
                  className={`closeSearch absolute top-0 left-0 lg:h-[2vw] lg:w-[2vw] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 mt-1 ${
                    searchActive && searchQuery === ""
                      ? ""
                      : "opacity-0 scale-0 pointer-events-none"
                  }`}
                >
                  <Icons.CloseIcon className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] hover:rotate-90 transition-all duration-300" />
                </div>
              </div>
            </div>

            {/* 🛒 CART + USER ICONS — only visible on large screens */}
            <div className="hidden lg:flex items-center gap-4">
              {/* 🛒 CART ICON — opens side panel */}
              <div
                onClick={() => setCartOpen(true)} // ✅ opens cart
                className="cart lg:h-[2vw] lg:w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110"
              >
                <Icons.CartIcon className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200" />
              </div>

              {/* 👤 USER ACCOUNT */}
              <div
                className="userAcc lg:h-[2vw] lg:w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110"
                onClick={() => navigate(user ? "/user" : "/login")}
              >
                <Icons.UserIcon
                  size={28}
                  className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] transition-transform duration-200"
                />
              </div>
            </div>
            {/* 🍔 MENU ICON (Mobile) */}
            <div className="lg:hidden block ml-2">
              <Icons.MenuIcon
                onClick={() => setMenuOpen(true)}
                className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200"
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
              className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-[10000] p-6 flex flex-col overflow-y-auto ${
                window.innerWidth < 1024 ? "w-full" : "w-[30vw]"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl lg:text-xl tracking-[1.3vw] lg:tracking-[0.3vw] uppercase text-[#b17362] hover:text-[#8e5546] font-semibold">
                  Your Cart
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="hover:rotate-90 transition-transform duration-300"
                >
                  <Icons.CloseIcon className="w-[30px] h-[30px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto text-[#b17362] hover:text-[#8e5546]">
                {cart.length === 0 ? (
                  <p className="text-center italic mt-[40%] opacity-60">
                    Your cart is empty 🛍️
                  </p>
                ) : (
                  cart.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between mb-4 border-b pb-3"
                    >
                      {/* 🖼 Product Image */}
                      <div className="w-[19vw] h-[25vw] lg:w-[5.5vw] lg:h-[7vw] rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.img}
                          alt={item.title}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      </div>

                      {/* 🛍 Product Info */}
                      <div className="flex-1 px-3 text-[#b17362] hover:text-[#8e5546]">
                        <p className="font-medium text-xl font-semibold leading-tight">
                          {item.title}
                        </p>
                        {item.size && (
                          <p className="text-xs text-gray-500">
                            Size: {item.size}
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 lg:gap-2 mt-1">
                          <button
                            onClick={() =>
                              useCartStore
                                .getState()
                                .updateQuantity(
                                  item.id,
                                  item.size,
                                  item.quantity - 1
                                )
                            }
                            className="w-6 h-6 flex items-center justify-center border border-[#A96A5A] text-[#b17362] hover:text-[#8e5546] rounded-md hover:bg-[#A96A5A] hover:text-white transition-all duration-200"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              useCartStore
                                .getState()
                                .updateQuantity(
                                  item.id,
                                  item.size,
                                  item.quantity + 1
                                )
                            }
                            className="w-6 h-6 flex items-center justify-center border border-[#A96A5A] text-[#b17362] hover:text-[#8e5546] rounded-md hover:bg-[#A96A5A] hover:text-white transition-all duration-200"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-lg font-semibold">
                          ₹{item.totalPrice.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {/* ❌ Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 🧮 Cart Total */}
              {cart.length > 0 && (
                <div className="mt-4 border-t pt-3 text-right text-[#b17362] hover:text-[#8e5546]">
                  <p className="text-sm font-semibold">
                    Total: ₹
                    {cart
                      .reduce((sum, item) => sum + item.totalPrice, 0)
                      .toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {cart.length > 0 && (
                <AnimatePresence>
                  {cart.length > 0 && (
                    <motion.button
                      key="checkout-btn"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.68, -0.55, 0.27, 1.55],
                      }}
                      onClick={() => {
                        setCartOpen(false);
                        setTimeout(() => navigate("/checkout"), 300);
                      }}
                      className="mt-6 w-full bg-[#A96A5A] text-white py-3 uppercase tracking-[0.2vw] rounded-md hover:bg-[#91584b] shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Checkout
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-[9998]"
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide Menu from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="fixed right-0 top-0 h-full w-[70vw] bg-white shadow-2xl z-[9999] p-6 flex flex-col gap-5 text-[#b17362] uppercase tracking-[2px]"
            >
              <button
                onClick={() => setMenuOpen(false)}
                className="self-end hover:rotate-90 transition-transform duration-300"
              >
                <Icons.CloseMenuIcon className="w-[20px] h-[20px] lg:w-[28px] lg:h-[28px] text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200" />
              </button>

              {[
                { name: "All Products", path: "/AllProducts" },
                { name: "New Arrivals", path: "/NewArrivals" },
                { name: "Festive", path: "/Festive" },
                { name: "Kurties", path: "/kurties" },
                { name: "Dresses", path: "/dresses" },
                { name: "Categories", path: "/categories" },
                { name: "Contact Us", path: "/contact" },
              ].map(({ name, path }) => (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-medium hover:text-[#91584b] transition-colors"
                >
                  {name}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* 📱 Bottom Navbar for Small Screens */}
      <div
        className="bottom-nav lg:hidden fixed bottom-0 left-0 right-0 h-[10vh] w-full 
  bg-white border-t border-[#e5e5e5] z-[9999] 
  flex justify-between items-center px-6 pt-2 
  shadow-[0_-1px_6px_rgba(0,0,0,0.08)] select-none transition-none will-change-transform
  pointer-events-auto" // 🧱 make navbar fully intercept clicks
        style={{ pointerEvents: "auto" }}
      >
        {[
          { name: "Home", path: "/", icon: Icons.HomeIcon },
          { name: "New", path: "/NewArrivals", icon: Icons.StarIcon },
          { name: "Categories", path: "/categories", icon: Icons.TagIcon },
          {
            name: "Account",
            path: user ? "/user" : "/login",
            icon: Icons.UserIcon,
          },
          { name: "Cart", path: "#cart", icon: Icons.CartIcon },
        ].map(({ name, path, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={name}
              onClick={() => {
                if (name === "Cart") {
                  setCartOpen(true); // ✅ open cart panel instead of navigating
                } else {
                  navigate(path);
                }
              }}
              className={`flex flex-col items-center justify-center h-full pointer-events-auto transition-all duration-200 ${
                isActive ? "text-[#A96A5A]" : "text-[#7B6A65]"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isActive ? "text-[#A96A5A]" : "text-[#7B6A65]"
                  } transition-colors duration-200`}
                />
                {name === "Cart" && cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-semibold px-[5px] rounded-full leading-none">
                    {cart.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-[2px] uppercase tracking-[0.8px] font-medium">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default Navbar;
