import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Icons from "../assets/Icons/Icons";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // ✅ Real-time listener for order document
        const orderRef = doc(db, "users", user.uid, "orders", id);
        const unsub = onSnapshot(orderRef, (snap) => {
          if (snap.exists()) {
            setOrder(snap.data());
          } else {
            console.warn("Order not found in Firestore");
            setOrder(null);
          }
          setLoading(false);
        });

        // 🧹 Clean up snapshot listener when component unmounts
        return () => unsub();
      } catch (error) {
        console.error("Error fetching order details:", error);
        setOrder(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // --- Helpers ---
  const getNumericPrice = (price) => {
    // Accepts number, strings like "₹6,299", "6,299", "6299" and returns number
    if (price == null) return 0;
    if (typeof price === "number") return price;
    if (typeof price === "string") {
      // strip non numeric, minus, dot
      const num = Number(price.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(num) ? num : 0;
    }
    return 0;
  };

  const formatCurrency = (num) =>
    Number.isFinite(num)
      ? num.toLocaleString("en-IN", { maximumFractionDigits: 0 })
      : "0";

  // Convert Firestore timestamp safely to JS Date (returns null if can't)
  const extractDate = (dt) => {
    if (!dt) return null;
    // Firestore Timestamp object has toDate() or seconds
    if (typeof dt.toDate === "function") return dt.toDate();
    if (dt.seconds) return new Date(dt.seconds * 1000);
    // If it's already a string/number or Date
    const maybeDate = new Date(dt);
    if (!isNaN(maybeDate)) return maybeDate;
    return null;
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-[#A96A5A] text-lg">
        Loading order details...
      </div>
    );

  if (!order)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-[#A96A5A]">
        <p>Order not found or unavailable.</p>
        <button
          onClick={() => navigate("/user")}
          className="mt-3 bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#91584b]"
        >
          Go Back
        </button>
      </div>
    );

  // Compute safe item totals
  const items = Array.isArray(order.items) ? order.items : [];
  const computedSubtotal = items.reduce((acc, item) => {
    // item.currentPrice might be "₹6,299" or numeric
    const price = getNumericPrice(
      item.currentPrice ?? item.price ?? item.originalPrice ?? 0
    );
    const qty = Number(item.quantity) || 0;
    return acc + price * qty;
  }, 0);

  const shipping = Number(order.shipping) || 0;
  const computedTotal = computedSubtotal + shipping;

  // Use order.total if it's a valid number, otherwise fallback to computedTotal
  const displayTotal = Number(order.total)
    ? Number(order.total)
    : computedTotal;

  // Format date
  const dateObj = extractDate(order.date);
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Unknown date";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fff9f7] to-[#fff] flex justify-center py-[2vw] px-6">
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate("/user", { state: { activeTab: "orders" } })}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF2F0] text-[#A96A5A] hover:bg-[#EAD8D2] transition-all shadow-md border border-[#EAD8D2]"
        >
          <Icons.BackIcon size={22} />
        </button>
      </div>
      <div className="bg-white shadow-md rounded-xl w-full max-w-[900px] p-8 border border-[#EAD8D2]/60">
        <h2 className="text-2xl font-semibold text-[#A96A5A] mb-4">
          Order Details
        </h2>

        <div className="flex justify-between text-sm text-[#7B6A65] mb-6">
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Date:</strong> {formattedDate}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`font-semibold ${
                order.status === "Delivered"
                  ? "text-green-700"
                  : order.status === "Shipped"
                  ? "text-blue-700"
                  : "text-yellow-700"
              }`}
            >
              {order.status ?? "Processing"}
            </span>
          </p>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-6">
          {items.length === 0 ? (
            <div className="text-center text-sm text-[#7B6A65]">
              No items in this order.
            </div>
          ) : (
            items.map((item, i) => {
              const unitPrice = getNumericPrice(
                item.currentPrice ?? item.price ?? item.originalPrice ?? 0
              );
              const qty = Number(item.quantity) || 0;
              const lineTotal = unitPrice * qty;
              return (
                <div
                  key={i}
                  className="flex justify-between items-center border border-[#EBDAD5]/60 rounded-md p-4 bg-white/80"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-16 h-16 rounded-md object-cover border border-[#EBDAD5]"
                    />
                    <div>
                      <p className="font-medium text-[#A96A5A]">
                        {item.title || "Unnamed product"}
                      </p>
                      <p className="text-sm text-[#7B6A65]">
                        Size: {item.size ?? "-"} | Qty: {qty}
                      </p>
                      <p className="text-sm text-[#7B6A65]">
                        ₹{formatCurrency(unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-[#A96A5A]">
                    ₹{formatCurrency(lineTotal)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Price Summary */}
        <div className="border-t border-[#EBDAD5] pt-4 text-sm text-[#7B6A65] space-y-2 mb-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{formatCurrency(computedSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {shipping === 0 ? "Free" : `₹${formatCurrency(shipping)}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-[#A96A5A] text-base border-t border-[#EBDAD5] pt-2">
            <span>Total</span>
            <span>₹{formatCurrency(displayTotal)}</span>
          </div>
        </div>

        {/* Delivery details */}
        <div className="border-t border-[#EBDAD5] pt-4 text-sm text-[#7B6A65] mb-6">
          <h3 className="font-semibold text-[#A96A5A] mb-2">
            Delivery Details
          </h3>
          <p>{order.address?.name ?? "—"}</p>
          <p>
            {order.address?.line1 ?? ""}{" "}
            {order.address?.city ? `, ${order.address.city}` : ""}{" "}
            {order.address?.state ? `, ${order.address.state}` : ""}{" "}
            {order.address?.zip ? `- ${order.address.zip}` : ""}
          </p>
          <p>
            <Icons.PhoneIcon className="inline" /> {order.address?.phone ?? "—"}
          </p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() =>
              navigate("/user", { state: { activeTab: "orders" } })
            }
            className="border border-[#A96A5A]/60 text-[#A96A5A] px-4 py-2 rounded-md hover:bg-[#FAF2F0] transition-all"
          >
            Back to Orders
          </button>
          <button className="bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#91584b] transition-all">
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
