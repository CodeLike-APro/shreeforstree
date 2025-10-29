import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Icons from "../assets/Icons/Icons";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email === "ceoprinci@gmail.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== "ceoprinci@gmail.com") {
        alert("Unauthorized access. Admins only!");
        window.location.href = "/";
        return;
      }
      setAdmin(true);

      const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        orderList.sort(
          (a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)
        );
        setOrders(orderList);
        setLoading(false);
      });

      return () => unsubOrders();
    });

    return () => unsubAuth();
  }, []);

  const updateStatus = async (id, newStatus, userId) => {
    try {
      const res = await fetch("https://shreeforstree.in/api/update-order.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          status: newStatus,
          userId,
          authKey: "rafhuc-duhtu3-jypHat",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");
      // console.log("✅ Order updated:", data);
    } catch (err) {
      // console.error("❌ Failed to update:", err);
      alert("Update failed: " + err.message);
    }
  };

  if (!admin) return null;

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-[#A96A5A]">
        Loading orders...
      </div>
    );

  return (
    <div className="px-2 py-14 lg:px-8 lg:py-14 bg-[#fff9f7] min-h-screen">
      <div className="fixed top-19 left-2 lg:top-25 lg:left-8 z-50">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF2F0] text-[#A96A5A] hover:bg-[#EAD8D2] transition-all shadow-md border border-[#EAD8D2]"
        >
          <Icons.BackIcon size={22} />
        </button>
      </div>
      {/* ✅ Show only if admin */}
      {isAdmin && (
        <button
          onClick={() => navigate("/admin/products")}
          className="fixed top-138 right-3 lg:top-29 lg:right-8 px-4 py-2 bg-[#A96A5A] text-white rounded-lg border border-[#A96A5A]/30 shadow-md hover:shadow-xl hover:scale-105 hover:bg-[#8E574B] active:scale-95 transition-all duration-300 ease-out z-50 animate-[float_3s_ease-in-out_infinite]"
        >
          Products
        </button>
      )}

      <h2 className="text-xl lg:text-2xl font-semibold text-[#A96A5A] mb-6 tracking-[.27vw] lg:tracking-[.1vw]">
        Admin Dashboard — All Orders
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => {
          const firstItem = order.items?.[0];
          const image =
            firstItem?.image || firstItem?.img || "/placeholder.jpg";
          const customerName = order.address?.name || "Unknown Customer";

          return (
            <div
              key={order.id}
              onClick={() => navigate(`/admin/order/${order.id}`)}
              className="cursor-pointer group p-4 border border-[#EBDAD5] bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <img
                  src={image}
                  alt={firstItem?.title || "Product"}
                  className="w-20 h-20 object-cover rounded-lg border border-[#EBDAD5]"
                />

                <div className="flex-1">
                  <p className="font-semibold text-[#A96A5A] text-lg truncate">
                    {customerName}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {order.userEmail}
                  </p>
                  <p className="text-md text-[#A96A5A] mt-1">
                    <b>₹{order.total}</b>
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-700">
                  <b>Status:</b>{" "}
                  <span className="text-[#A96A5A] font-medium">
                    {order.status || "Processing"}
                  </span>
                </p>
                <select
                  value={order.status || "Processing"}
                  onChange={(e) =>
                    updateStatus(order.id, e.target.value, order.userId)
                  }
                  onClick={(e) => e.stopPropagation()} // prevent navigation
                  className="border rounded px-2 py-1 text-sm text-[#A96A5A] focus:outline-none focus:ring-2 focus:ring-[#A96A5A]/30"
                >
                  <option value="Processing">Processing</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
