import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import Icons from "../assets/Icons/Icons";

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
    <div className="bg-[#fff9f7] flex justify-center items-center">
      <div className="px-2 py-14 lg:px-8 lg:py-8 bg-[#fff9f7] min-h-screen w-full lg:w-[80%]">
        <div className="fixed top-19 left-2 lg:top-26 lg:left-20 z-50">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF2F0] text-[#A96A5A] hover:bg-[#EAD8D2] transition-all shadow-md border border-[#EAD8D2]"
          >
            <Icons.BackIcon size={22} />
          </button>
        </div>

        <h2 className="text-xl lg:text-2xl font-semibold text-[#A96A5A] mb-4">
          Order #{id}
        </h2>

        <div className="bg-white py-3 px-2 lg:px-6 lg:py-6 text-[#A96A5A] rounded-lg shadow-md border border-[#EBDAD5]">
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
                  <p>Price: {item.currentPrice || item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-xl font-semibold text-[#A96A5A]">
              Total: ₹{order.total}
            </p>
            <p className="text-md text-[#A96A5A]">
              <b>Status:</b>{" "}
              <span className="text-[#A96A5A] font-medium">{order.status}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
