import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // <-- add useNavigate here
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
  console.log("Searching for:", tempQuery);

  return (
    <>
      <div
        id="NavBar"
        className="bg-white fixed h-[7vw] border-b-1 border-black w-full flex items-center justify-between z-[9999]"
      >
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
          <div className="lg:hidden block">
            <Icons.MenuIcon
              size={30}
              onClick={() => setMenuOpen(true)}
              className="text-[#b17362] hover:text-[#8e5546] cursor-pointer"
            />
          </div>
          <div className="quickLinks flex gap-7 uppercase text-[0.9vw] tracking-[2.7px] ">
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
        <div className="h-full flex items-center justify-center mr-7">
          <div className="h-full w-full flex items-center justify-center gap-4 text-[#b17362] hover:text-[#8e5546]">
            <div
              className={`relative flex -mr-2 items-center rounded-[0.5vw] pr-2 transition-all duration-300 ${
                searchActive || searchQuery
                  ? "border-[1.5px] border-[#A96A5A] bg-white"
                  : "border-[1.5px] border-transparent bg-transparent"
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
                    ? "w-[15vw] px-3 opacity-100"
                    : "w-0 px-0 opacity-0 cursor-pointer"
                }`}
              />

              {/* Clear button */}
              <div
                onClick={() => {
                  setTempQuery(""); // ✅ clears local input field
                  setSearchQuery(""); // ✅ clears Zustand state
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
                  onClick={(e) => {
                    inputRef.current?.focus();
                    handleSearch(e);
                  }}
                  className={`openSearch h-[2vw] w-[2vw] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 ${
                    searchActive && searchQuery === ""
                      ? "opacity-0 scale-0 pointer-events-none"
                      : ""
                  }`}
                >
                  <Icons.SearchIcon
                    size={28}
                    className="text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <div
                  onClick={handleSearch} // ✅ triggers redirect
                  className={`closeSearch absolute top-0 left-0 h-[2vw] w-[2vw] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 mt-1 ${
                    searchActive && searchQuery === ""
                      ? ""
                      : "opacity-0 scale-0 pointer-events-none"
                  }`}
                >
                  <Icons.CloseIcon
                    size={24}
                    className="text-[#b17362] hover:text-[#8e5546] hover:rotate-90 transition-all duration-300"
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
                className="text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200"
              />
            </div>

            {/* 👤 USER ACCOUNT */}
            <div className="userAcc h-[2vw] w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110">
              {user ? (
                user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    onClick={() => navigate("/user")}
                    className="h-[2vw] w-[2vw] rounded-full object-cover border border-[#A96A5A] hover:opacity-80 transition-opacity duration-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none"; // hide broken image
                      e.target.parentNode.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#b17362" class="w-full h-full">
              <path d="M12 12c2.67 0 8 1.34 8 4v4H4v-4c0-2.66 5.33-4 8-4zm0-2c-1.66 0-3-1.34-3-3S10.34 4 12 4s3 
              1.34 3 3-1.34 3-3 3z" />
            </svg>
          `;
                    }}
                  />
                ) : (
                  <Icons.UserIcon
                    size={28}
                    className="text-[#b17362] hover:text-[#8e5546] transition-transform duration-200"
                    onClick={() => navigate("/user")}
                  />
                )
              ) : (
                <Icons.UserIcon
                  size={28}
                  className="text-[#b17362] hover:text-[#8e5546] hover:scale-110 transition-transform duration-200"
                  onClick={() => navigate("/login")}
                />
              )}
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
                <h2 className="text-xl tracking-[0.3vw] uppercase text-[#b17362] hover:text-[#8e5546] font-semibold">
                  Your Cart
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="hover:rotate-90 transition-transform duration-300"
                >
                  <Icons.CloseIcon
                    size={26}
                    className="text-[#b17362] hover:text-[#8e5546]"
                  />
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
                      <div className="w-[4vw] h-[5vw] rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.img}
                          alt={item.title}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      </div>

                      {/* 🛍 Product Info */}
                      <div className="flex-1 px-3 text-[#b17362] hover:text-[#8e5546]">
                        <p className="font-medium text-sm leading-tight">
                          {item.title}
                        </p>
                        {item.size && (
                          <p className="text-xs text-gray-500">
                            Size: {item.size}
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-1">
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

                        <p className="text-xl font-semibold">
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

              <button
                onClick={() => {
                  setCartOpen(false);
                  setTimeout(() => navigate("/checkout"), 300); // smooth close + redirect
                }}
                className="mt-6 w-full bg-[#A96A5A] text-white py-3 uppercase tracking-[0.2vw] rounded-md hover:bg-[#91584b] transition-all duration-300"
              >
                Checkout
              </button>
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

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="fixed left-0 top-0 h-full w-[70vw] bg-white shadow-lg z-[9999] p-6 flex flex-col gap-4 text-[#b17362] hover:text-[#8e5546] uppercase tracking-[2.5px]"
            >
              <button
                onClick={() => setMenuOpen(false)}
                className="self-end hover:rotate-90 transition-transform duration-300"
              >
                <Icons.CloseMenuIcon size={26} />
              </button>

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
    </>
  );
};

export default Navbar;
