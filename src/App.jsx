import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/navigation/Navbar";
import Home from "./pages/Home";
import Footer from "./components/navigation/Footer";
import AllProducts from "./pages/All-Products";
import NewArrivals from "./pages/New-Arrivals";
import FestiveCollection from "./pages/FestiveCollection";
import Kurtis from "./pages/Kurtis";
import Dresses from "./pages/Dresses";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";

const App = () => {
  const location = useLocation(); // ✅ this is the missing piece
  useEffect(() => {
    console.log("Current path:", location.pathname);
  }, [location]);

  return (
    <div>
      <Navbar />
      <div className="pt-[7vw]">
        {/* Force re-render when path changes */}
        <Routes key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/AllProducts" element={<AllProducts />} />
          <Route path="/NewArrivals" element={<NewArrivals />} />
          <Route path="/Festive" element={<FestiveCollection />} />
          <Route path="/kurtis" element={<Kurtis />} />
          <Route path="/dresses" element={<Dresses />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default App;
