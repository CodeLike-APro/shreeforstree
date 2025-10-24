import toast from "react-hot-toast";

// ✅ Base style shared by all
const baseStyle = {
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "0.95rem",
  fontWeight: 500,
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  animation: "fadeIn 0.3s ease",
};

// 🎨 Toast color themes
const theme = {
  success: {
    background: "#F0FFF4",
    color: "#166534",
    border: "1px solid #A7F3D0",
  },
  error: {
    background: "#FEF2F2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
  },
  warning: {
    background: "#FFFBEB",
    color: "#92400E",
    border: "1px solid #FCD34D",
  },
  info: {
    background: "#EFF6FF",
    color: "#1E40AF",
    border: "1px solid #93C5FD",
  },
};

// ⚡ Reusable toast functions
export const notify = {
  success: (msg) =>
    toast.success(msg, { style: { ...baseStyle, ...theme.success } }),
  error: (msg) => toast.error(msg, { style: { ...baseStyle, ...theme.error } }),
  warning: (msg) => toast(msg, { style: { ...baseStyle, ...theme.warning } }),
  info: (msg) => toast(msg, { style: { ...baseStyle, ...theme.info } }),
};
