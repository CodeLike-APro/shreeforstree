import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navigation/Navbar";
import Home from "./pages/Home";
// import AllProducts from "./pages/AllProducts";
// import NewArrivals from "./pages/NewArrivals";
// import FestiveCollection from "./pages/FestiveCollection";
// import Kurtis from "./pages/Kurtis";
// import Categories from "./pages/Categories";
// import Contact from "./pages/Contact";

const App = () => {
  return (
    <div>
      <Navbar />
      <div className=" pt-[7vw]">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/all-products" element={<AllProducts />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/festive" element={<FestiveCollection />} />
         <Route path="/kurtis" element={<Kurtis />} />
         <Route path="/categories" element={<Categories />} />
         <Route path="/contact" element={<Contact />} /> */}
        </Routes>
      </div>
    </div>
  );
};

export default App;
