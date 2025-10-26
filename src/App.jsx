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
import "./firebase";
import { browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "./firebase";
import Payment from "./pages/Payment";
import OrderDetails from "./pages/OrderDetails";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import FAQs from "./pages/FAQs";
import { Toaster } from "react-hot-toast";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrderDetails from "./pages/AdminOrderDetails";

const App = () => {
  const location = useLocation();

  useEffect(() => {
    // console.log("Current path:", location.pathname);
  }, [location]);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  }, []);

  return (
    <div id="ScrollContainer" className="min-h-screen flex flex-col">
      {/* ✅ Navbar always at top */}
      <Navbar />

      {/* ✅ Main content area */}
      <div
        id="main-content"
        className="flex-1 overflow-y-auto pt-[16vw] lg:pb-[12vh] lg:pt-[7vw] lg:pb-0"
      >
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
          <Route path="/Payment" element={<Payment />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/TermsAndConditions" element={<TermsAndConditions />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/order/:id" element={<AdminOrderDetails />} />
        </Routes>
      </div>

      {/* ✅ Footer always at bottom */}
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "8px",
            fontFamily: "Poppins, sans-serif",
          },
          success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
        containerStyle={{
          top: 80,
        }}
      />
    </div>
  );
};

export default App;
