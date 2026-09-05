const RAZORPAY_CHECKOUT_SCRIPT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise: Promise<void> | null = null;

export function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay checkout can only be loaded in the browser."),
    );
  } else if (typeof window.Razorpay !== "undefined") {
    return Promise.resolve();
  } else if (loadPromise) {
    return loadPromise;
  } else {
    loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
      script.async = true;

      script.onload = () => {
        if (typeof window.Razorpay === "undefined") {
          loadPromise = null; // Reset the loadPromise on error
          script.remove(); // Remove the script element from the DOM
          reject(
            new Error(
              "Failed to load Razorpay checkout. Check your internet connection or try again later.",
            ),
          );
          return;
        }
        resolve();
      };

      script.onerror = () => {
        loadPromise = null; // Reset the loadPromise on error
        script.remove(); // Remove the script element from the DOM
        reject(
          new Error(
            "Razorpay checkout loaded but failed to initialize. Check your internet connection or try again later.",
          ),
        );
      };

      document.body.appendChild(script);
    });

    return loadPromise;
  }
}
