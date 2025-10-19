import React, { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import axios from "axios";

const Checkout = () => {
  const { cart, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [savedAddress, setSavedAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // ✅ Fetch saved address from backend
  useEffect(() => {
    axios
      .get("/api/get-address/USER_ID") // Replace with actual user ID from auth
      .then((res) => {
        if (res.data?.address) {
          setAddress(res.data.address);
          setSavedAddress(true);
        }
      })
      .catch(() => {});
  }, []);

  // ✅ Save address before proceeding
  const handleAddressSubmit = async () => {
    if (!address.name || !address.phone || !address.pincode) {
      alert("Please fill all required fields");
      return;
    }

    await axios.post("/api/save-address", { userId: "USER_ID", address });
    setStep(2);
  };

  // ✅ Razorpay integration
  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/api/create-order", {
        amount: total * 100, // Razorpay needs amount in paise
        currency: "INR",
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "Shree For Stree",
        description: "Order Payment",
        order_id: data.id,
        handler: async function (response) {
          await axios.post("/api/verify-payment", {
            ...response,
            amount: total,
            cart,
          });
          clearCart();
          setStep(3); // ✅ Success Step
        },
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: { color: "#A96A5A" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment failed. Please try again.");
    }
    setLoading(false);
  };

  // ✅ Success Screen
  if (step === 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#A96A5A]">
        <h1 className="text-4xl font-light uppercase tracking-[0.3vw]">
          Payment Successful 🎉
        </h1>
        <p className="mt-3 text-lg">Your order has been placed successfully!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-[#A96A5A] p-10">
      <h1 className="text-3xl uppercase font-light mb-8 tracking-[1vw]">
        {step === 1 && "Shipping Address"}
        {step === 2 && "Select Payment Method"}
      </h1>

      {/* 🏠 Step 1: Address Form */}
      {step === 1 && (
        <div className="w-[90%] sm:w-[60%] md:w-[40%] bg-[#fffaf8] border border-[#A96A5A]/40 shadow-md rounded-xl p-10 flex flex-col gap-5">
          <h2 className="text-center text-2xl uppercase tracking-[0.2vw] font-light mb-2 text-[#A96A5A] tracking-[0.5vw]">
            Shipping Details
          </h2>

          {Object.entries(address).map(([key, value]) => (
            <input
              key={key}
              type="text"
              placeholder={key.toUpperCase()}
              value={value}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="border border-[#A96A5A]/30 bg-white rounded-lg px-4 py-3 text-[#A96A5A] placeholder-[#A96A5A]/50 
                   focus:border-[#A96A5A] focus:ring-2 focus:ring-[#A96A5A]/40 outline-none transition-all duration-300"
            />
          ))}

          <button
            onClick={handleAddressSubmit}
            className="mt-6 bg-[#A96A5A] text-white py-3 rounded-lg font-medium uppercase tracking-[0.2vw]
                 hover:bg-[#91584b] active:scale-95 transition-all duration-300"
          >
            {savedAddress ? "Use Saved Address" : "Save and Continue"}
          </button>
        </div>
      )}

      {/* 💳 Step 2: Payment */}
      {step === 2 && (
        <div className="w-[40vw] border border-[#A96A5A] rounded-lg p-8 flex flex-col items-center gap-6">
          <p className="text-xl font-light">
            Total: ₹{total.toLocaleString("en-IN")}
          </p>

          <button
            disabled={loading}
            onClick={handlePayment}
            className="bg-[#A96A5A] text-white px-8 py-3 rounded-md uppercase hover:bg-[#91584b] transition-all duration-300"
          >
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
