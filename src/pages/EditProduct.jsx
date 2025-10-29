import React, { useState, useRef, useEffect } from "react";
import { db, auth } from "./../firebase";
import { notify } from "./../components/common/toast";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

const EditProduct = () => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    tags: "",
    sizes: "",
    color: "",
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user || user.email !== "ceoprinci@gmail.com") {
        alert("Unauthorized access. Admins only!");
        window.location.href = "/";
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const dropRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setForm({
          title: data.title || "",
          description: data.description || "",
          price: data.price || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          sizes: Array.isArray(data.sizes) ? data.sizes.join(", ") : "",
          color: data.color || "",
        });
        setImages(data.images || []);
      } else {
        alert("Product not found!");
      }
    };

    fetchProduct();
  }, [id]);

  // 🧠 Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add("border-[#A96A5A]");
  };

  const handleDragLeave = () => {
    dropRef.current.classList.remove("border-[#A96A5A]");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    dropRef.current.classList.remove("border-[#A96A5A]");
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await uploadFiles(files);
  };

  // 🪄 Upload function
  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);

    const totalFiles = files.length;
    let uploaded = [];

    for (let i = 0; i < totalFiles; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);

      const res = await fetch(
        "https://shreeforstree.in/api/upload-product-image.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.success) {
        uploaded.push(data.url);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
    }

    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      ...form,
      images,
      price: parseFloat(form.price),
      tags: form.tags.split(",").map((t) => t.trim()),
      sizes: form.sizes.split(",").map((s) => s.trim()),
      dateAdded: serverTimestamp(),
    };

    if (id) {
      // Update existing product
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, productData);
      notify.success("✅ Product updated successfully!");
    } else {
      // Add new one (fallback)
      await addDoc(collection(db, "products"), productData);
      notify.success("✅ Product added successfully!");
    }

    notify.success("✅ Product added successfully!");
    setForm({
      title: "",
      description: "",
      price: "",
      tags: "",
      sizes: "",
      color: "",
    });
    setImages([]);
  };
  if (loading) return <div>Checking access...</div>;
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-xl border border-[#F0E0DB]">
      <h2 className="text-3xl font-semibold mb-4 text-[#A96A5A] text-center">
        Add New Product
      </h2>

      {/* 🖼️ Drag & Drop Zone */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-full border-2 border-dashed border-[#D5B6AA] rounded-lg p-6 text-center cursor-pointer transition-all hover:border-[#A96A5A]"
      >
        <p className="text-[#7B6A65]">
          Drag & drop product images here, or{" "}
          <label className="text-[#A96A5A] cursor-pointer font-medium underline">
            click to upload
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </p>

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-[#F5D3C3]/40 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#A96A5A] h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2 text-[#7B6A65]">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {/* 📸 Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-6">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt="preview"
                className="w-full h-28 object-cover rounded-md border border-[#EBDAD5]"
              />
              <button
                onClick={() =>
                  setImages((prev) => prev.filter((_, index) => index !== i))
                }
                className="absolute top-1 right-1 bg-[#A96A5A]/80 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🧾 Product Info Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="text"
          placeholder="Product Title"
          className="w-full border border-[#EBDAD5] p-2 rounded-md focus:border-[#A96A5A] outline-none"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <textarea
          placeholder="Description"
          className="w-full border border-[#EBDAD5] p-2 rounded-md resize-y focus:border-[#A96A5A]"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          type="number"
          placeholder="Price (₹)"
          className="w-full border border-[#EBDAD5] p-2 rounded-md focus:border-[#A96A5A]"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Tags (comma separated)"
          className="w-full border border-[#EBDAD5] p-2 rounded-md focus:border-[#A96A5A]"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />

        <input
          type="text"
          placeholder="Sizes (comma separated)"
          className="w-full border border-[#EBDAD5] p-2 rounded-md focus:border-[#A96A5A]"
          value={form.sizes}
          onChange={(e) => setForm({ ...form, sizes: e.target.value })}
        />

        <input
          type="text"
          placeholder="Color"
          className="w-full border border-[#EBDAD5] p-2 rounded-md focus:border-[#A96A5A]"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-[#A96A5A] text-white py-3 rounded-md text-lg font-medium hover:bg-[#91584b] transition-all"
        >
          {uploading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
