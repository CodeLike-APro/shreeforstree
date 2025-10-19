import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

// 🧭 Layout components
import Navbar from "./components/navigation/Navbar";
import Footer from "./components/navigation/Footer";

// 🏠 Pages
import Home from "./pages/Home";
import AllProducts from "./pages/All-Products";
import NewArrivals from "./pages/New-Arrivals";
import FestiveCollection from "./pages/FestiveCollection";
import Kurties from "./pages/Kurties";
import Dresses from "./pages/Dresses";
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import Product from "./components/common/Product";
import CategoryPage from "./pages/CategoryPage";
import SearchResults from "./pages/SearchResults";
import Checkout from "./pages/Checkout";
import User from "./pages/User";
import Login from "./pages/Login";

const App = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("Current path:", location.pathname);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ✅ Navbar always at top */}
      <Navbar />
      {/* ✅ Main content area */}
      <main className="flex-grow pt-[7vw]">
        <Routes key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/AllProducts" element={<AllProducts />} />
          <Route path="/NewArrivals" element={<NewArrivals />} />
          <Route path="/Festive" element={<FestiveCollection />} />
          <Route path="/Kurties" element={<Kurties />} />
          <Route path="/Dresses" element={<Dresses />} />
          <Route path="/Categories" element={<Categories />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/category/:tagName" element={<CategoryPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/user" element={<User />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      {/* ✅ Footer always at bottom */}
      <Footer />
    </div>
  );
};

export default App;
