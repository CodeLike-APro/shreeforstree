// src/pages/User.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const User = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get token once, inside the effect scope
    const token = localStorage.getItem("userToken");
    if (!token) {
      // If no token, redirect to auth/login
      navigate("/auth");
      return;
    }

    // Fetch user info from backend
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          "https://backend-ready-for-vercel.vercel.app/api/user",
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
          }
        );

        // defensively set structure
        setUser(
          data?.user || {
            name: "Guest User",
            phone: "Not available",
            email: null,
            orders: [],
            addresses: [],
          }
        );
      } catch (err) {
        console.error("Error fetching user:", err?.message || err);
        setError("Unable to fetch profile. Try again later.");
        // still set a fallback user so UI can render
        setUser({
          name: "Guest User",
          phone: "Not available",
          email: null,
          orders: [],
          addresses: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-[#A96A5A] text-lg">
        Loading your profile...
      </div>
    );
  }

  // If for some reason user is still null (shouldn't happen), show fallback
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-[#A96A5A] text-lg">
        {error || "No user data available."}
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile Info" },
    { id: "orders", label: "My Orders" },
    { id: "address", label: "Saved Addresses" },
    { id: "settings", label: "Account Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5D3C3] to-[#fff] py-[5vw] flex flex-col items-center">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-xl w-[90%] max-w-[1000px] p-8">
        <h1 className="text-3xl font-semibold text-[#A96A5A] mb-6 text-center uppercase tracking-wider">
          My Account
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-6 mb-6 border-b border-[#A96A5A]/20 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`uppercase tracking-wider text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "text-[#A96A5A] border-b-2 border-[#A96A5A]"
                  : "text-gray-400 hover:text-[#A96A5A]"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "profile" && (
            <div className="flex flex-col gap-3 text-[#A96A5A]">
              <h2 className="text-xl font-semibold mb-2">Personal Details</h2>
              <p>
                <span className="font-medium">Name:</span> {user.name}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {user.phone}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {user.email || "Not added"}
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-2">Note: {error}</p>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="text-[#A96A5A]">
              <h2 className="text-xl font-semibold mb-3">Order History</h2>
              {user.orders?.length ? (
                <ul className="space-y-4">
                  {user.orders.map((order, i) => (
                    <li
                      key={i}
                      className="p-4 border border-[#A96A5A]/30 rounded-md hover:bg-[#A96A5A]/5 transition-all"
                    >
                      <p className="font-medium">Order #{order.id}</p>
                      <p>Date: {order.date}</p>
                      <p>Status: {order.status}</p>
                      <p>Total: ₹{order.total}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic opacity-70">No orders yet.</p>
              )}
            </div>
          )}

          {activeTab === "address" && (
            <div className="text-[#A96A5A]">
              <h2 className="text-xl font-semibold mb-3">Saved Addresses</h2>
              {user.addresses?.length ? (
                <ul className="space-y-4">
                  {user.addresses.map((addr, i) => (
                    <li
                      key={i}
                      className="p-4 border border-[#A96A5A]/30 rounded-md hover:bg-[#A96A5A]/5 transition-all"
                    >
                      {addr.line1}, {addr.city}, {addr.state} - {addr.zip}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic opacity-70">No addresses saved.</p>
              )}
              <button className="mt-4 bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#91584b] transition-all">
                Add New Address
              </button>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-[#A96A5A]">
              <h2 className="text-xl font-semibold mb-3">Account Settings</h2>
              <button
                onClick={() => {
                  localStorage.removeItem("userToken");
                  alert("Logged out successfully");
                  navigate("/auth");
                }}
                className="bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#91584b] transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default User;
