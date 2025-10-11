import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
    console.log("Searching for:", searchQuery);
    // later: add real search logic here
  };

  return (
    <div className="bg-white fixed h-[7vw] border-b-1 border-black w-full flex items-center justify-between z-9999">
      <div className="h-full flex items-center justify-center ml-7">
        <div className="logo h-[7vw] w-[7vw] overflow-hidden mr-7">
          <Link to={"/"}>
            <img className="h-full w-full" src="/logo/shreeforstree.png" />
          </Link>
        </div>
        <div className="quickLinks flex gap-7 uppercase text-[0.9vw] tracking-[2.7px] ">
          <div className="flex gap-7">
            {[
              "all products",
              "new arrivals",
              "festive",
              "kurtis",
              "categories",
              "contact us",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="relative text-[#e3b49f] hover:text-[#A96A5A] transition-all duration-200
                 after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-[#A96A5A] 
                 after:w-0 hover:after:w-full hover:scale-105 after:translate-x-[-50%] after:transition-all after:duration-300"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="h-full flex items-center justify-center mr-7">
        <div className="h-full w-full flex items-center justify-center gap-4">
          <div className="searchField relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setSearchActive(false)}
              className={`absolute group right-[2.5vw] outline-none border border-gray-300 px-3 py-1 rounded-full text-[0.9vw] transition-all duration-300 ${
                searchActive || searchQuery
                  ? "opacity-100 w-[15vw]"
                  : "opacity-0 w-0 cursor-pointer"
              }`}
            />

            <div
              onClick={() => {
                inputRef.current?.focus(); // 👈 this triggers focus animation
                handleSearch();
              }}
              className="search h-[2vw] w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110"
            >
              <svg
                className="h-full w-full"
                viewBox="0 0 24 24"
                width="26"
                height="26"
              >
                <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path>
              </svg>
            </div>
          </div>

          <div className="search h-[2vw] w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110">
            <svg
              className="h-full w-full"
              viewBox="0 0 24 24"
              width="26"
              height="26"
            >
              <path d="M9 6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6H9ZM7 6H4C3.44772 6 3 6.44772 3 7V21C3 21.5523 3.44772 22 4 22H20C20.5523 22 21 21.5523 21 21V7C21 6.44772 20.5523 6 20 6H17C17 3.23858 14.7614 1 12 1C9.23858 1 7 3.23858 7 6ZM9 10C9 11.6569 10.3431 13 12 13C13.6569 13 15 11.6569 15 10H17C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10H9Z"></path>
            </svg>
          </div>

          <div className="search h-[2vw] w-[2vw] cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-110">
            <svg
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="26"
              height="26"
            >
              <path d="M20 22H18V20C18 18.3431 16.6569 17 15 17H9C7.34315 17 6 18.3431 6 20V22H4V20C4 17.2386 6.23858 15 9 15H15C17.7614 15 20 17.2386 20 20V22ZM12 13C8.68629 13 6 10.3137 6 7C6 3.68629 8.68629 1 12 1C15.3137 1 18 3.68629 18 7C18 10.3137 15.3137 13 12 13ZM12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
