import React, { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Icons from "../assets/Icons/Icons";
import { notify } from "../components/common/toast";

const Checkout = () => {
  const { cart = [], updateQuantity } = useCartStore();
  const [cartReady, setCartReady] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const navigate = useNavigate();

  // 🧮 Price calculations
  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(
        String(item.currentPrice)
          .replace(/[^\d.]/g, "")
          .trim() || 0
      ) *
        (item.quantity || 1),
    0
  );
  // console.log("🛒 Cart contents at checkout:", cart);
  const shipping = subtotal > 1000 ? 0 : 99;
  const total = subtotal + shipping;

  // 🕒 Wait for Zustand hydration
  useEffect(() => {
    const timer = setTimeout(() => setCartReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // 🧠 Fetch user’s saved addresses (realtime)
  useEffect(() => {
    setLoadingAddresses(true);

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);

      const unsub = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
          }
          setLoadingAddresses(false);
        },
        (err) => {
          console.error("Error fetching addresses:", err);
          setLoadingAddresses(false);
        }
      );

      // Cleanup Firestore listener when user changes
      return () => unsub();
    });

    // Cleanup Auth listener
    return () => unsubAuth();
  }, [navigate]);

  // 🏠 Add a new address
  const handleAddAddress = async () => {
    const user = auth.currentUser;
    if (!user) return notify.info("Please log in to add an address.");

    const { name, line1, city, state, zip, phone } = newAddress;
    if (!name || !line1 || !city || !state || !zip || !phone) {
      notify.error("Please fill all address fields.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.exists() ? userSnap.data() : {};
      const updatedAddresses = Array.isArray(data.addresses)
        ? [...data.addresses, newAddress]
        : [newAddress];

      await setDoc(userRef, { addresses: updatedAddresses }, { merge: true });

      setAddresses(updatedAddresses);
      setShowAddAddress(false);
      setNewAddress({
        name: "",
        line1: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
      });

      notify.success("Address saved successfully!");
    } catch (err) {
      console.error("Error saving address:", err);
      notify.error("Something went wrong while saving address.");
    }
  };

  // 🧾 Continue to Payment
  const handleContinue = () => {
    if (!selectedAddress) {
      notify.error("Please select a shipping address before continuing!");
      return;
    }

    sessionStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
    navigate("/Payment");
  };

  // 🧱 Guard rendering states
  if (!cartReady) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-[#A96A5A] text-lg">
        Loading your cart...
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-[#A96A5A]">
        <Icons.CartIcon className="text-5xl mb-4 opacity-70" />
        <p className="text-lg mb-3">Your cart is empty.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#A96A5A] text-white px-5 py-2 rounded-md hover:bg-[#91584b] transition-all"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center text-[#A96A5A] p-10 bg-gradient-to-br from-[#fff9f7] to-[#fff]">
      <h1 className="text-3xl uppercase font-light mb-8 tracking-[1vw]">
        Checkout
      </h1>

      {/* 🏠 Saved Addresses */}
      <div className="w-[90%] sm:w-[80%] md:w-[60%] bg-[#fffaf8] border border-[#A96A5A]/40 shadow-md rounded-xl p-8 mb-8">
        <h2 className="text-center text-2xl font-light mb-6 uppercase">
          Select Shipping Address
        </h2>

        {loadingAddresses ? (
          <p className="text-center text-[#A96A5A]/60">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <div className="text-center">
            <p className="text-[#A96A5A]/70 mb-4">
              No saved addresses found. Add one below.
            </p>
            <button
              onClick={() => setShowAddAddress(true)}
              className="bg-[#A96A5A] text-white px-5 py-2 rounded-md hover:bg-[#91584b] transition-all"
            >
              + Add New Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr, i) => (
              <label
                key={i}
                className={`block border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAddress === addr
                    ? "border-[#A96A5A] bg-[#F9E8E2]"
                    : "border-[#EBDAD5] hover:border-[#A96A5A]/70"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddress === addr}
                  onChange={() => setSelectedAddress(addr)}
                  className="hidden"
                />
                <p className="font-medium">{addr.name}</p>
                <p className="text-sm text-[#7B6A65]">{addr.line1}</p>
                <p className="text-sm text-[#7B6A65]">
                  {addr.city}, {addr.state} - {addr.zip}
                </p>
                <p className="text-sm text-[#7B6A65] flex gap-1">
                  <Icons.PhoneIcon size="18" /> {addr.phone}
                </p>
              </label>
            ))}

            <button
              onClick={() => setShowAddAddress(true)}
              className="w-full mt-3 text-sm py-2 border border-[#A96A5A]/60 text-[#A96A5A] rounded-md hover:bg-[#FAF2F0] transition-all"
            >
              + Add New Address
            </button>
          </div>
        )}
      </div>

      {/* 🧾 Order Summary */}
      <div className="w-[90%] sm:w-[80%] md:w-[60%] bg-white border border-[#EBDAD5] rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold mb-4 text-[#A96A5A]">
          Order Summary
        </h2>

        <div className="divide-y divide-[#EAD8D2] mb-6">
          {cart.map((item, i) => {
            const priceValue = Number(
              String(item.currentPrice || item.price)
                .replace(/[^\d.]/g, "")
                .trim() || 0
            );

            return (
              <div
                key={i}
                className="flex items-center justify-between py-4 sm:flex-row flex-col gap-4 border-b border-[#EBDAD5]/50 last:border-none"
              >
                {/* Left side: image + product info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.img ?? item.image ?? "/placeholder.png"}
                    alt={item.title ?? item.name ?? "Product"}
                    className="w-16 h-16 object-cover rounded-md border border-[#EBDAD5]"
                  />

                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-[#A96A5A]">
                      {item.title ?? item.name ?? "Unnamed product"}
                    </p>

                    {/* 🪡 Size Preview */}
                    {item.size && (
                      <p className="text-xs text-[#7B6A65]">
                        Size:{" "}
                        <span className="font-medium text-[#A96A5A] uppercase">
                          {item.size}
                        </span>
                      </p>
                    )}

                    <p className="text-sm text-[#7B6A65]">
                      ₹{priceValue.toLocaleString("en-IN")}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.size,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="px-2 border border-[#A96A5A]/50 rounded-md hover:bg-[#FAF2F0]"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity + 1)
                        }
                        className="px-2 border border-[#A96A5A]/50 rounded-md hover:bg-[#FAF2F0]"
                      >
                        +
                      </button>

                      {/* 🗑️ Remove button */}
                      <button
                        onClick={() =>
                          useCartStore
                            .getState()
                            .removeFromCart(item.id, item.size)
                        }
                        className="ml-3 text-sm text-red-500 hover:text-red-600 hover:underline font-medium transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: total price per item */}
                <div className="text-right w-full sm:w-auto">
                  <p className="font-semibold text-[#A96A5A]">
                    ₹{(priceValue * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 💰 Price Breakdown */}
        <div className="text-sm text-[#7B6A65] space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}
            </span>
          </div>
          <hr className="border-[#EBDAD5] my-3" />
          <div className="flex justify-between font-semibold text-[#A96A5A]">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="mt-6 w-full bg-[#A96A5A] text-white py-3 rounded-md uppercase hover:bg-[#91584b] transition-all"
        >
          Continue
        </button>
      </div>

      {/* 🏠 Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-8 w-[90%] max-w-md shadow-xl border border-[#EAD8D2]/70">
            <h2 className="text-lg font-semibold text-[#A96A5A] mb-4">
              Add New Address
            </h2>

            <div className="space-y-3">
              {[
                { label: "Full Name", key: "name" },
                { label: "Address Line", key: "line1" },
                { label: "City", key: "city" },
                { label: "State", key: "state" },
                { label: "ZIP Code", key: "zip" },
                { label: "Phone Number", key: "phone" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-[#A96A5A]/70 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={newAddress[key]}
                    onChange={(e) =>
                      setNewAddress((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full border border-[#EBDAD5] rounded-md p-2 text-sm focus:ring-1 focus:ring-[#A96A5A] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddAddress(false)}
                className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                className="text-sm px-4 py-2 rounded-md bg-[#A96A5A] text-white hover:bg-[#91584b] transition-all"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
