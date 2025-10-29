import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Icons from "../assets/Icons/Icons";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user || user.email !== "ceoprinci@gmail.com") {
        alert("Unauthorized access. Admins only!");
        window.location.href = "/";
      } else {
        await fetchProducts();
      }
    });

    return () => unsub();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);
    } catch (err) {
      console.error("🔥 Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts((prev) => prev.filter((p) => p.id !== id));
        alert("Product deleted successfully!");
      } catch (err) {
        alert("Error deleting product: " + err.message);
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-[#A96A5A]">
        Loading products...
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-[#fff9f7]">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#A96A5A] tracking-wide">
          Manage Products
        </h2>
        <button
          onClick={() => navigate("/admin/add-product")}
          className="bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#8E574B] transition-all"
        >
          + Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="border border-[#EBDAD5] rounded-lg bg-white shadow-md hover:shadow-lg p-4 transition-all"
          >
            <img
              src={p.images?.[0] || p.img || "/fallback-user-icon.svg"}
              alt={p.title}
              className="w-full h-48 object-cover rounded-md mb-4"
            />

            <h3 className="text-lg font-semibold text-[#A96A5A] truncate">
              {p.title}
            </h3>
            <p className="text-sm text-[#7B6A65] truncate mb-2">
              ₹{p.currentPrice || p.price}
            </p>

            <div className="flex justify-between">
              <button
                onClick={() => navigate(`/admin/edit-product/${p.id}`)}
                className="bg-[#A96A5A] text-white px-3 py-1.5 rounded-md hover:bg-[#8E574B] transition-all text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-all text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
