import React, { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  arrayUnion,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { notify } from "../components/common/toast";

const Payment = () => {
  const { cart, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // 🧮 Safe price parser (handles ₹ symbols, commas, numbers)
  const getNumericPrice = (price) => {
    if (!price) return 0;
    if (typeof price === "number") return price;
    return Number(price.replace(/[^0-9.-]+/g, "")) || 0;
  };

  // Compute totals
  const subtotal = cart.reduce(
    (acc, item) =>
      acc +
      getNumericPrice(item.currentPrice || item.price || item.originalPrice) *
        item.quantity,
    0
  );

  const shipping = subtotal > 999 ? 0 : 49;
  const total = subtotal + shipping;

  // 🧠 Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // ⚙️ Handle Razorpay payment
  const handlePayment = async () => {
    const user = auth.currentUser;
    if (!user) {
      notify.info("Please sign in to continue.");
      navigate("/login");
      return;
    }

    try {
      // 🧠 Show the “Processing Payment...” overlay
      setIsProcessing(true);

      // Step 1: Create Razorpay order via backend
      const res = await fetch("https://shreeforstree.in/api/create-order.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      const order = await res.json();
      if (!order.id) {
        // console.error("❌ Razorpay order creation failed:", order);
        notify.warning("Could not initiate payment. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Step 2: Configure Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
        name: "Shree For Stree",
        description: "Order Payment",
        image: "/logo.png",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 🧾 Fetch user reference
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : {};

            // 🏠 Pull selected address from Checkout (sessionStorage)
            const selectedAddress = JSON.parse(
              sessionStorage.getItem("selectedAddress")
            );

            // 🛍️ Prepare order data
            const newOrder = {
              id: response.razorpay_payment_id,
              razorpay_order_id: order.id,
              items: cart,
              total,
              subtotal,
              shipping,
              status: "Processing",
              date: new Date().toISOString(),
              address: {
                ...(selectedAddress || {
                  name: user.displayName || "Customer",
                  phone: user.phoneNumber || "—",
                  line1: "Address not available",
                }),
                email: user.email,
              },
            };

            // 💾 Save order under user's collection
            await setDoc(
              doc(
                db,
                "users",
                user.uid,
                "orders",
                response.razorpay_payment_id
              ),
              {
                ...newOrder,
                date: serverTimestamp(),
              }
            );

            // 💾 Also save globally for admin dashboard
            await setDoc(doc(db, "orders", response.razorpay_payment_id), {
              ...newOrder,
              userId: user.uid,
              userEmail: user.email,
              date: serverTimestamp(),
            });

            // 📧 Send email notifications
            await fetch("https://shreeforstree.in/api/send-order-mail.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order: newOrder }),
            });

            // 🧹 Clean up
            clearCart();
            notify.success("Payment successful! 🎉");
            navigate("/");
          } catch (err) {
            // console.error("🔥 Firestore save failed:", err);
            notify.warning(
              "Payment successful, but order could not be saved. Please contact support."
            );
          } finally {
            // 🧠 Hide loader after everything finishes
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.displayName || "Customer",
          email: user.email,
        },
        theme: { color: "#A96A5A" },
      };

      const paymentObject = new window.Razorpay(options);

      // 🧠 Hide loader when user closes or payment fails
      paymentObject.on("payment.failed", () => {
        setIsProcessing(false);
        notify.warning("Payment failed. Please try again.");
      });

      paymentObject.on("payment.closed", () => {
        setIsProcessing(false);
      });

      // 🚀 Open Razorpay checkout
      paymentObject.open();
    } catch (error) {
      // console.error("🔥 Error in payment flow:", error);
      notify.warning("Something went wrong. Please try again later.");
      setIsProcessing(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-[#A96A5A]">
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <button
          onClick={() => navigate("/AllProducts")}
          className="bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#91584b] transition-all"
        >
          Shop Now
        </button>
      </div>
    );

  return (
    <div className="min-h-[70vh] lg:min-h-screen bg-gradient-to-br from-[#fff9f7] to-[#fff] flex justify-center py-[2vw] px-6">
      <div className="bg-white/90 backdrop-blur-sm shadow-[0_4px_30px_rgba(169,106,90,0.08)] rounded-xl w-full max-w-[900px] border border-[#EAD8D2]/60 px-3 py-5 lg:px-8 lg:py-8">
        <h2 className="text-2xl font-semibold text-[#A96A5A] mb-6 text-center">
          Payment Summary
        </h2>

        {/* Order Items */}
        <div className="divide-y divide-[#EBDAD5] mb-2 lg:mb-6">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between py-2 lg:py-4">
              <div className="flex items-center gap-4">
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-20 lg:w-16 lg:h-16 object-cover rounded-md border border-[#EBDAD5]"
                />
                <div>
                  <p className="font-medium text-[#A96A5A]">{item.title}</p>
                  <p className="text-sm text-[#7B6A65]">Size: {item.size}</p>
                  <p className="text-sm text-[#7B6A65]">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-[#A96A5A]">
                ₹
                {(
                  getNumericPrice(
                    item.currentPrice || item.price || item.originalPrice
                  ) * item.quantity
                ).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-[#EBDAD5] pt-4 mb-8 space-y-2 text-sm text-[#7B6A65]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
          </div>
          <div className="flex justify-between font-medium text-[#A96A5A] text-base pt-2 border-t border-[#EBDAD5]">
            <span>Total Payable</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          className="w-full bg-[#A96A5A] hover:bg-[#91584b] text-white py-3 rounded-md text-lg transition-all"
        >
          Pay Now
        </button>
      </div>
      {isProcessing && (
        <div className="fixed inset-0 bg-[#fff9f7]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-[#A96A5A] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#A96A5A] text-lg font-medium">
            Processing Payment...
          </p>
        </div>
      )}
    </div>
  );
};

export default Payment;
