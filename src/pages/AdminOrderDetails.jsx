import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const docRef = doc(db, "orders", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) setOrder(snapshot.data());
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-[#A96A5A]">
        Loading order details...
      </div>
    );

  if (!order)
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-[#A96A5A]">
        <p>Order not found.</p>
        <button
          onClick={() => navigate("/admin")}
          className="mt-4 px-4 py-2 bg-[#A96A5A] text-white rounded-md"
        >
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <div className="p-8 bg-[#fff9f7] min-h-screen">
      <button
        onClick={() => navigate("/admin")}
        className="mb-6 px-4 py-2 bg-[#A96A5A] text-white rounded-md shadow hover:bg-[#8E574B] transition"
      >
        ← Back to Dashboard
      </button>

      <h2 className="text-2xl font-semibold text-[#A96A5A] mb-4">
        Order #{id}
      </h2>

      <div className="bg-white p-6 rounded-lg shadow-md border border-[#EBDAD5]">
        <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
        <p>
          <b>Name:</b> {order.address?.name}
        </p>
        <p>
          <b>Email:</b> {order.address?.email || order.userEmail}
        </p>
        <p>
          <b>Phone:</b> {order.address?.phone}
        </p>
        <p>
          <b>Address:</b> {order.address?.line1}, {order.address?.city},{" "}
          {order.address?.state} - {order.address?.zip}
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">Items</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {order.items?.map((item, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg bg-[#fffaf9] flex gap-4"
            >
              <img
                src={item.image || item.img}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p>Size: {item.size}</p>
                <p>Qty: {item.quantity}</p>
                <p>Price: ₹{item.currentPrice || item.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <p className="text-xl font-semibold text-[#A96A5A]">
            Total: ₹{order.total}
          </p>
          <p className="text-md text-gray-700">
            <b>Status:</b>{" "}
            <span className="text-[#A96A5A] font-medium">{order.status}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
