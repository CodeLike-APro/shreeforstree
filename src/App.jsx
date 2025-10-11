import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navigation/Navbar";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Home from "./pages/Home";

const App = () => {
  return (
    <div>
      <Navbar />
      <div className=" pt-[7vw]">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
