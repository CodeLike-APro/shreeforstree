import React, { useState, useEffect, useRef } from "react";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import Icons from "../assets/Icons/Icons";
import { AnimatePresence, motion } from "motion/react";

const User = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [orders, setOrders] = useState([]);
  const [editAddressIndex, setEditAddressIndex] = useState(null);
  const [showDeleteConfirmAddress, setShowDeleteConfirmAddress] =
    useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const menuRefs = useRef([]);
  const deleteModalRef = useRef(null);
  const deleteAddressModalRef = useRef(null);
  const logoutModalRef = useRef(null);

  // 🧠 Realtime user data listener
  useEffect(() => {
    let unsubFirestore = null;
    let unsubAuth = null;
    let authCheckComplete = false;

    const completeEmailLinkSignIn = async () => {
      authCheckComplete = false; // lock auth listener until done

      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = window.localStorage.getItem("emailForSignIn");
        if (email) {
          try {
            console.log("🔗 Completing passwordless sign-in for", email);
            await signInWithEmailLink(auth, email, window.location.href);
            console.log("✅ Passwordless sign-in complete");

            // cleanup
            window.localStorage.removeItem("emailForSignIn");
            window.localStorage.removeItem("pendingDeletion");

            // clean URL
            setTimeout(() => {
              window.history.replaceState({}, document.title, "/user");
            }, 500);
          } catch (error) {
            console.error("❌ Error completing passwordless sign-in:", error);
          }
        }
      }

      authCheckComplete = true; // unlock for listener now
    };

    const setupAuthListener = () => {
      unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (!authCheckComplete) return; // 👈 Prevent premature redirect

        if (currentUser) {
          console.log("👤 Authenticated user:", currentUser.email);
          await currentUser.reload();
          let updatedUser = auth.currentUser;

          if (!updatedUser.photoURL && updatedUser.providerData?.length > 0) {
            updatedUser = {
              ...updatedUser,
              photoURL: updatedUser.providerData[0].photoURL || null,
            };
          }

          setUser(updatedUser);
          setDisplayName(updatedUser.displayName || "");
          setEmail(updatedUser.email || "");

          const userDocRef = doc(db, "users", updatedUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            await setDoc(
              userDocRef,
              {
                uid: updatedUser.uid,
                displayName: updatedUser.displayName || "",
                email: updatedUser.email || "",
                phone: updatedUser.phoneNumber || "",
                addresses: [],
                orders: [],
                createdAt: new Date(),
              },
              { merge: true }
            );
          }

          unsubFirestore = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setAddresses(
                  Array.isArray(data.addresses) ? data.addresses : []
                );
                setOrders(Array.isArray(data.orders) ? data.orders : []);
                setPhone(data.phone || updatedUser.phoneNumber || "");
              }
              setLoading(false);
            },
            (error) => {
              console.error("🔥 Firestore listener error:", error);
              setLoading(false);
            }
          );
        } else {
          console.log("🚫 No user signed in yet");
          setUser(null);
          setLoading(false);
        }
      });
    };

    // 🔄 Ensure sign-in is checked before listener runs
    (async () => {
      await completeEmailLinkSignIn();
      setupAuthListener(); // ← no delay, run immediately after
    })();

    return () => {
      if (unsubFirestore) unsubFirestore();
      if (unsubAuth) unsubAuth();
    };
  }, []);

  // useEffect(() => {
  //   // Handle return from email link reauth
  //   if (isSignInWithEmailLink(auth, window.location.href)) {
  //     const email = window.localStorage.getItem("emailForSignIn");
  //     if (email) {
  //       signInWithEmailLink(auth, email, window.location.href)
  //         .then(() => {
  //           console.log("✅ Passwordless reauth successful");
  //           window.localStorage.removeItem("emailForSignIn");
  //         })
  //         .catch((error) => {
  //           console.error("❌ Error during email link reauth:", error);
  //         });
  //     }
  //   }
  // }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // --- Handle menu dropdown outside click ---
      if (menuRefs.current?.length) {
        const clickedOutsideMenu = !menuRefs.current.some(
          (ref) => ref && ref.contains(event.target)
        );

        if (clickedOutsideMenu) {
          setAddresses((prev) => prev.map((a) => ({ ...a, menuOpen: false })));
        }
      }

      // --- Handle Delete Account Modal ---
      if (
        deleteModalRef.current &&
        !deleteModalRef.current.contains(event.target)
      ) {
        setShowDeleteConfirm(false);
        setDeleteStep(1);
        setConfirmEmail("");
        setCurrentPassword("");
      }

      // --- Handle Delete Address Modal ---
      if (
        deleteAddressModalRef.current &&
        !deleteAddressModalRef.current.contains(event.target)
      ) {
        setShowDeleteConfirmAddress(null);
      }

      // --- Handle Logout Modal ---
      if (
        logoutModalRef.current &&
        !logoutModalRef.current.contains(event.target)
      ) {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[80vh] text-[#A96A5A] text-lg">
        Loading your profile...
      </div>
    );

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-[#A96A5A]">
        <p className="text-lg mb-4">Please sign in to view your account.</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#A96A5A] text-white px-4 py-2 rounded-md hover:bg-[#91584b] transition-all"
        >
          Go to Login
        </button>
      </div>
    );

  // 💾 Save changes
  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return alert("No user is currently signed in.");

      // Reauthenticate if needed
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Update display name
      if (displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName });
      }

      // Update email (if not Google)
      if (
        email !== currentUser.email &&
        user.providerData[0]?.providerId !== "google.com"
      ) {
        await updateEmail(currentUser, email);
      }

      // Update password
      if (newPassword) await updatePassword(currentUser, newPassword);

      // Update Firestore
      await setDoc(
        doc(db, "users", currentUser.uid),
        { displayName, email, phone },
        { merge: true }
      );

      // Update UI instantly
      setUser({ ...currentUser, displayName, email });
      setEditMode(false);
      setNewPassword("");
      setCurrentPassword("");

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      switch (err.code) {
        case "auth/wrong-password":
          alert("Incorrect current password.");
          break;
        case "auth/requires-recent-login":
          alert("Please re-login to make these changes.");
          break;
        case "auth/invalid-email":
          alert("Please enter a valid email address.");
          break;
        default:
          alert("Something went wrong while saving your profile.");
      }
    }
  };

  // 📍 Address handlers
  // 📍 Add new address (opens form)
  const handleAddAddress = (index = null) => {
    if (index !== null) {
      setNewAddress(addresses[index]);
      setEditAddressIndex(index);
    } else {
      setNewAddress({
        name: "",
        line1: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
      });
      setEditAddressIndex(null);
    }
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    const requiredFields = ["name", "line1", "city", "state", "zip", "phone"];
    if (requiredFields.some((f) => !newAddress[f]?.trim())) {
      alert("Please fill all address fields.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("User not authenticated!");
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);

    try {
      // 🔄 Get the current snapshot from Firestore
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};

      const currentAddresses = Array.isArray(data.addresses)
        ? [...data.addresses]
        : [];

      let updatedAddresses;

      if (typeof editAddressIndex === "number") {
        currentAddresses[editAddressIndex] = { ...newAddress };
        updatedAddresses = [...currentAddresses];
        console.log("📝 Updated address index:", editAddressIndex);
      } else {
        updatedAddresses = [
          ...currentAddresses,
          { ...newAddress, createdAt: new Date() },
        ];
        console.log("➕ Added new address");
      }

      // ✅ Write it cleanly (merge keeps all other fields like 'orders')
      await setDoc(
        userRef,
        {
          addresses: updatedAddresses,
        },
        { merge: true }
      );

      // ✅ Instant UI reflection
      setAddresses(updatedAddresses);
      setShowAddressForm(false);
      setEditAddressIndex(null);
      setNewAddress({
        name: "",
        line1: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
      });

      alert("Address saved successfully!");
    } catch (error) {
      console.error("❌ Error saving address:", error);
      alert("Failed to save address. Check console for details.");
    }
  };

  // 🗑️ Delete address
  const handleDeleteAddress = async (index) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("User not authenticated!");
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const updated = addresses.filter((_, i) => i !== index);

    try {
      await setDoc(
        userRef,
        {
          addresses: updatedAddresses,
          orders: userData.orders || [], // keep orders
        },
        { merge: true }
      );
      console.log("🗑️ Address deleted from Firestore");

      // Locally update UI immediately
      setAddresses(updated);
    } catch (error) {
      console.error("❌ Error deleting address:", error);
      alert("Failed to delete address. Try again.");
    }
  };

  // 🔥 Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f7] to-[#fff] flex justify-center py-[2vw] px-6">
      <div className="bg-white/90 backdrop-blur-sm shadow-[0_4px_30px_rgba(169,106,90,0.08)] rounded-xl w-full max-w-[1100px] flex overflow-hidden border border-[#EAD8D2]/60">
        {/* Sidebar */}
        <div className="w-[22%] border-r border-[#F1E3DE] flex flex-col bg-[#fffaf8]/80">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-[#F1E3DE]">
            {user.photoURL ? (
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-[2px] border-transparent bg-[linear-gradient(135deg,#A96A5A,#D8A79E,#A96A5A)] p-[1px]">
                <div className="w-full h-full rounded-full bg-white overflow-hidden">
                  <img
                    src={user.photoURL}
                    alt="User Avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://cdn-icons-png.flaticon.com/512/1077/1077012.png";
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-[#EAD8D2]/40 text-[#A96A5A] border border-[#B8860B]/60">
                <Icons.UserIcon />
              </div>
            )}

            <div>
              <h1 className="text-sm text-[#A96A5A]/60 mt-1">Welcome,</h1>
              <p className="text-xl font-medium text-[#A96A5A] leading-tight">
                {displayName?.split(" ")[0] || "User"}
              </p>
            </div>
          </div>

          {/* Sidebar Tabs */}
          <aside className="pt-8 pb-4 flex flex-col gap-3">
            {[
              {
                id: "profile",
                label: "Profile Information",
                icon: <Icons.UserIcon />,
              },
              { id: "orders", label: "My Orders", icon: <Icons.CartIcon /> },
              {
                id: "address",
                label: "Saved Addresses",
                icon: <Icons.HomeIcon />,
              },
              {
                id: "settings",
                label: "Account Settings",
                icon: <Icons.GearIcon />,
              },
            ].map(({ id, label, icon }) => (
              <div
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-3 px-5 py-2 cursor-pointer transition-all ${
                  activeTab === id
                    ? "text-[#A96A5A] bg-[#F9E8E2]"
                    : "text-[#7B6A65] hover:bg-[#FAF2F0]"
                }`}
              >
                {activeTab === id && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-[#A96A5A] rounded-r-md"></span>
                )}
                <span className="text-[1.1rem]">{icon}</span>
                <span className="text-[0.95rem] font-medium">{label}</span>
              </div>
            ))}

            <div
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-5 py-2 mt-3 text-red-500 text-[0.95rem] font-medium cursor-pointer hover:bg-red-50 rounded-md transition-all"
            >
              <span>Logout</span>
            </div>
          </aside>
        </div>

        {/* 🧾 Main Content */}
        <main className="flex-1 px-10 py-8">
          {/* Profile */}
          {activeTab === "profile" && (
            <section className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[#A96A5A]">
                  Personal Information
                </h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-sm px-4 py-1.5 border border-[#A96A5A]/60 rounded-md text-[#A96A5A] hover:bg-[#A96A5A] hover:text-white transition-all"
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs text-[#A96A5A]/70 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    disabled={!editMode}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full border rounded-md p-2 text-sm ${
                      editMode
                        ? "border-[#A96A5A]/50 focus:ring-1 focus:ring-[#A96A5A]"
                        : "border-[#EBDAD5] bg-[#FAF7F6]"
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-[#A96A5A]/70 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={
                      !editMode ||
                      user.providerData[0]?.providerId === "google.com"
                    }
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border rounded-md p-2 text-sm ${
                      editMode
                        ? user.providerData[0]?.providerId === "google.com"
                          ? "border-[#EBDAD5] bg-[#FAF7F6] cursor-not-allowed"
                          : "border-[#A96A5A]/50 focus:ring-1 focus:ring-[#A96A5A]"
                        : "border-[#EBDAD5] bg-[#FAF7F6]"
                    }`}
                  />
                  {editMode &&
                    user.providerData[0]?.providerId === "google.com" && (
                      <p className="text-xs text-[#A96A5A]/70 mt-1 italic">
                        Email managed by Google — cannot be changed here.
                      </p>
                    )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs text-[#A96A5A]/70 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    disabled={!editMode}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full border rounded-md p-2 text-sm ${
                      editMode
                        ? "border-[#A96A5A]/50 focus:ring-1 focus:ring-[#A96A5A]"
                        : "border-[#EBDAD5] bg-[#FAF7F6]"
                    }`}
                  />
                </div>
              </div>

              {editMode && (
                <button
                  onClick={handleSave}
                  className="mt-6 bg-[#A96A5A] text-white text-sm px-4 py-2 rounded-md hover:bg-[#91584b] transition-all"
                >
                  Save Changes
                </button>
              )}
            </section>
          )}
          {/* 🏠 Saved Addresses Tab */}
          {activeTab === "address" && (
            <section className="max-w-xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#A96A5A]">
                  Saved Addresses
                </h2>

                {addresses.length > 0 && (
                  <button
                    onClick={handleAddAddress}
                    className="text-sm px-4 py-1.5 border border-[#A96A5A]/60 rounded-md text-[#A96A5A] hover:bg-[#A96A5A] hover:text-white transition-all"
                  >
                    + Add New
                  </button>
                )}
              </div>

              {/* 🗃 No addresses */}
              {addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                  <Icons.HomeIcon className="text-[#A96A5A] text-5xl mb-4 opacity-70" />
                  <h2 className="text-lg font-medium text-[#A96A5A] mb-2">
                    No saved addresses yet
                  </h2>
                  <p className="text-sm text-[#A96A5A]/70 mb-5">
                    Add one to make your checkouts faster!
                  </p>
                  <button
                    onClick={handleAddAddress}
                    className="bg-[#A96A5A] text-white text-sm px-4 py-2 rounded-md hover:bg-[#91584b] transition-all"
                  >
                    + Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses
                    .filter((addr) => addr && addr.name) // ✅ ignore undefined entries
                    .map((addr, i) => (
                      <div
                        key={i}
                        className="border border-[#EBDAD5] rounded-lg p-4 bg-[#FFF9F8] flex justify-between items-start"
                      >
                        <div>
                          <p className="font-medium text-[#A96A5A]">
                            {addr.name}
                          </p>
                          <p className="text-sm text-[#7B6A65]">{addr.line1}</p>
                          <p className="text-sm text-[#7B6A65]">
                            {addr.city}, {addr.state} - {addr.zip}
                          </p>
                          <p className="text-sm text-[#7B6A65] flex gap-1">
                            <Icons.PhoneIcon size="20" /> {addr.phone}
                          </p>
                        </div>
                        {/* 3-dot dropdown menu */}
                        <div
                          className="relative"
                          ref={(el) => (menuRefs.current[i] = el)}
                        >
                          <button
                            onClick={() =>
                              setAddresses((prev) =>
                                prev.map((a, idx) =>
                                  idx === i
                                    ? { ...a, menuOpen: !a.menuOpen }
                                    : { ...a, menuOpen: false }
                                )
                              )
                            }
                            className="text-[#A96A5A] rounded-full transition-transform duration-300 hover:scale-115"
                          >
                            <Icons.DotIcon />
                          </button>

                          <AnimatePresence>
                            {addr.menuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-28 bg-white border border-[#EBDAD5] rounded-md shadow-md z-50"
                              >
                                <button
                                  onClick={() => {
                                    handleAddAddress(i);
                                    setAddresses((prev) =>
                                      prev.map((a, idx) => ({
                                        ...a,
                                        menuOpen: false,
                                      }))
                                    );
                                  }}
                                  className="block w-full text-left text-sm px-4 py-2 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setShowDeleteConfirmAddress(i);
                                    setAddresses((prev) =>
                                      prev.map((a, idx) => ({
                                        ...a,
                                        menuOpen: false,
                                      }))
                                    );
                                  }}
                                  className="block w-full text-left text-sm px-4 py-2 text-red-500 hover:bg-red-50 transition-all"
                                >
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}
          {/* 🛒 Orders Tab */}
          {activeTab === "orders" && (
            <section className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#A96A5A]">
                  My Orders
                </h2>
              </div>

              {/* 🗃 No Orders */}
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                  <Icons.CartIcon className="text-[#A96A5A] text-5xl mb-4 opacity-70" />
                  <h2 className="text-lg font-medium text-[#A96A5A] mb-2">
                    Why does it feel so light in here?
                  </h2>
                  <p className="text-sm text-[#A96A5A]/70 mb-5">
                    Looks like you haven’t placed any orders yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {orders.map((order, i) => (
                    <div
                      key={i}
                      className="border border-[#EBDAD5] rounded-lg p-5 bg-[#FFF9F8] shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[#A96A5A] font-semibold">
                          Order #{order.id || i + 1}
                        </h3>
                        <span className="text-sm text-[#7B6A65]/70">
                          {order.date
                            ? new Date(
                                order.date.seconds * 1000
                              ).toLocaleDateString()
                            : "Unknown date"}
                        </span>
                      </div>

                      <div className="text-sm text-[#7B6A65] space-y-1">
                        {order.items?.map((item, j) => (
                          <p key={j}>
                            • {item.name} × {item.quantity}
                          </p>
                        ))}
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <span className="font-medium text-[#A96A5A]">
                          Total: ₹{order.total || 0}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-md ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {/* ⚙️ Account Settings Tab */}
          {activeTab === "settings" && (
            <section className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-[#A96A5A] mb-4">
                Account Settings
              </h2>
              <p className="text-sm text-[#A96A5A]/70 mb-6">
                Manage your account preferences, privacy, and security.
              </p>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm w-full bg-red-500 text-white py-2.5 rounded-md hover:bg-red-600 transition-all"
              >
                Delete Account
              </button>
            </section>
          )}
        </main>
        {/* 🏠 Add Address Modal */}
        {showAddressForm && (
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
                      value={newAddress?.[key] || ""} // ✅ prevents crash
                      onChange={(e) =>
                        setNewAddress((prev) => ({
                          ...(prev || {}), // ✅ ensures object always exists
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
                  onClick={() => {
                    setShowAddressForm(false);
                    setNewAddress({
                      name: "",
                      line1: "",
                      city: "",
                      state: "",
                      zip: "",
                      phone: "",
                    });
                    setEditAddressIndex(null);
                  }}
                  className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveAddress();
                  }}
                  className="text-sm px-4 py-2 rounded-md bg-[#A96A5A] text-white hover:bg-[#91584b] transition-all"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 🗑️ Confirm Delete Address Modal */}
        <AnimatePresence>
          {showDeleteConfirmAddress !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
            >
              <motion.div
                ref={deleteAddressModalRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg p-8 w-[90%] max-w-md shadow-xl border border-[#EAD8D2]/70"
              >
                <h2 className="text-lg font-semibold text-[#A96A5A] mb-3">
                  Delete Address
                </h2>
                <p className="text-sm text-[#7B6A65] mb-6 leading-relaxed">
                  Are you sure you want to delete this address? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirmAddress(null)}
                    className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await handleDeleteAddress(showDeleteConfirmAddress);
                      setShowDeleteConfirmAddress(null);
                    }}
                    className="text-sm px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* 🗑️ Delete Account Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
            >
              <motion.div
                ref={deleteModalRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg p-8 w-[90%] max-w-md shadow-xl border border-[#EAD8D2]/70 relative"
              >
                <h2 className="text-lg font-semibold text-[#A96A5A] mb-3">
                  {deleteStep === 1
                    ? "Delete Account"
                    : deleteStep === 2
                    ? "Confirm Your Email"
                    : "Final Confirmation"}
                </h2>

                {/* Step 1: Warning */}
                {deleteStep === 1 && (
                  <div>
                    <p className="text-sm text-[#7B6A65] mb-6 leading-relaxed">
                      This action is <strong>irreversible</strong>. Once
                      deleted, all your account information — including your
                      profile, saved addresses, and order history — will be
                      permanently erased.
                    </p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setDeleteStep(2)}
                        className="text-sm px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Email confirmation */}
                {deleteStep === 2 && (
                  <div>
                    <p className="text-sm text-[#7B6A65] mb-4">
                      Please type <strong>{user.email}</strong> below to confirm
                      your identity before proceeding.
                    </p>
                    <input
                      type="text"
                      placeholder="Enter your email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className="w-full border border-[#EBDAD5] rounded-md p-2 text-sm focus:ring-1 focus:ring-[#A96A5A] focus:outline-none mb-6"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setConfirmEmail("");
                          setDeleteStep(1);
                        }}
                        className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (confirmEmail.trim() === user.email)
                            setDeleteStep(3);
                          else alert("Email does not match. Please try again.");
                        }}
                        className="text-sm px-4 py-2 rounded-md bg-[#A96A5A] text-white hover:bg-[#91584b] transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Final Confirmation */}
                {/* Step 3: Final Confirmation */}
                {deleteStep === 3 && (
                  <div>
                    {user.providerData[0]?.providerId === "password" ? (
                      <>
                        <p className="text-sm text-[#7B6A65] mb-6 leading-relaxed">
                          For security reasons, please re-enter your current
                          password before deleting your account. This ensures
                          that only you can perform this irreversible action.
                        </p>
                        <input
                          type="password"
                          placeholder="Enter your current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full border border-[#EBDAD5] rounded-md p-2 text-sm focus:ring-1 focus:ring-[#A96A5A] focus:outline-none mb-6"
                        />
                      </>
                    ) : (
                      <p className="text-sm text-[#7B6A65] mb-6 leading-relaxed">
                        You signed in using <strong>Google</strong>. You’ll be
                        asked to reauthenticate through Google before your
                        account is deleted.
                      </p>
                    )}

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setConfirmEmail("");
                          setCurrentPassword("");
                          setDeleteStep(1);
                          setShowDeleteConfirm(false);
                        }}
                        className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            const currentUser = auth.currentUser;
                            if (!currentUser) {
                              alert("No user is signed in.");
                              return;
                            }

                            const uid = currentUser.uid;
                            const providerId =
                              currentUser.providerData[0]?.providerId;

                            // 🔐 Step 1: Reauthenticate
                            if (providerId === "password") {
                              if (!currentPassword.trim()) {
                                alert("Please enter your current password.");
                                return;
                              }

                              const credential = EmailAuthProvider.credential(
                                currentUser.email,
                                currentPassword
                              );
                              await reauthenticateWithCredential(
                                currentUser,
                                credential
                              );
                            } else if (providerId === "google.com") {
                              const {
                                GoogleAuthProvider,
                                reauthenticateWithPopup,
                              } = await import("firebase/auth");
                              const googleProvider = new GoogleAuthProvider();
                              await reauthenticateWithPopup(
                                currentUser,
                                googleProvider
                              );
                            }
                            // 📨 Handle passwordless (email link) users
                            else if (providerId === "emailLink") {
                              // Ask user for confirmation to send new link

                              window.localStorage.setItem(
                                "pendingDeletion",
                                "true"
                              );
                              window.localStorage.setItem(
                                "emailForSignIn",
                                currentUser.email
                              );
                              if (
                                confirm(
                                  "For security, we’ll send you a new sign-in link to confirm deletion. Once you click it, you can delete your account."
                                )
                              ) {
                                const { sendSignInLinkToEmail } = await import(
                                  "firebase/auth"
                                );
                                const actionCodeSettings = {
                                  url: "https://shreeforstree-foe1ru12a-akshit-guptas-projects-3d09e3b1.vercel.app/user", // ✅ your deployed URL
                                  handleCodeInApp: true,
                                };

                                await sendSignInLinkToEmail(
                                  auth,
                                  currentUser.email,
                                  actionCodeSettings
                                );
                                alert(
                                  "A new confirmation email has been sent. Click that link to verify and then delete your account."
                                );
                                return; // exit early, they'll come back after reauth
                              }
                            }

                            // 🔥 Step 2: Delete Firestore document FIRST
                            const userRef = doc(db, "users", uid);
                            await deleteDoc(userRef);
                            console.log("✅ Firestore user data deleted:", uid);

                            // 🧹 Step 3: Delete Firebase Auth user
                            await currentUser.delete();

                            alert(
                              "Your account and all related data have been permanently deleted."
                            );
                            navigate("/");
                          } catch (error) {
                            console.error("Account deletion failed:", error);

                            switch (error.code) {
                              case "auth/popup-closed-by-user":
                                alert(
                                  "You closed the Google sign-in popup before confirming."
                                );
                                break;
                              case "auth/wrong-password":
                                alert("Incorrect password. Please try again.");
                                break;
                              case "auth/requires-recent-login":
                                alert(
                                  "Please reauthenticate to delete your account."
                                );
                                break;
                              default:
                                alert(
                                  "Something went wrong while deleting your account. Try again."
                                );
                            }
                          }
                        }}
                        className="text-sm px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                      >
                        Confirm Deletion
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚪 Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
              onClick={() => setShowLogoutConfirm(false)} // 👈 close when backdrop clicked
            >
              <motion.div
                ref={logoutModalRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg p-8 w-[90%] max-w-md shadow-xl border border-[#EAD8D2]/70"
                onClick={(e) => e.stopPropagation()} // 👈 prevent bubbling inside modal
              >
                <h2 className="text-lg font-semibold text-[#A96A5A] mb-3">
                  Confirm Logout
                </h2>
                <p className="text-sm text-[#7B6A65] mb-6 leading-relaxed">
                  Are you sure you want to log out? You’ll need to sign in again
                  to access your account.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="text-sm px-4 py-2 rounded-md border border-[#A96A5A]/60 text-[#A96A5A] hover:bg-[#FAF2F0] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      signOut(auth).then(() => {
                        setShowLogoutConfirm(false);
                        navigate("/");
                      });
                    }}
                    className="text-sm px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all"
                  >
                    Yes, Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default User;
