import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f7] to-[#fff] flex justify-center px-6 py-12">
      <div className="max-w-4xl bg-white rounded-xl shadow-md border border-[#EAD8D2]/70 p-8 text-[#7B6A65] leading-relaxed">
        <h1 className="text-3xl font-semibold text-[#A96A5A] mb-6">
          Privacy Policy
        </h1>

        <p className="mb-6">
          Welcome to <strong>Shree For Stree</strong>. Your privacy is extremely
          important to us. This Privacy Policy describes how we collect, use,
          store, and protect your personal information when you visit or make a
          purchase from our website.
        </p>

        {/* 1. Information We Collect */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            1. Information We Collect
          </h2>
          <p>
            We collect the following types of information to provide a better
            shopping experience:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Personal Details:</strong> such as your name, email, phone
              number, and address when you create an account or place an order.
            </li>
            <li>
              <strong>Payment Information:</strong> collected securely through
              our payment gateway partners (like Razorpay). We do not store your
              card details on our servers.
            </li>
            <li>
              <strong>Usage Data:</strong> including IP address, browser type,
              device info, and pages visited to improve our website’s
              performance.
            </li>
            <li>
              <strong>Authentication Data:</strong> if you sign in via Google or
              Email/Password using Firebase Authentication.
            </li>
          </ul>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            2. How We Use Your Information
          </h2>
          <p>
            We use the collected information for purposes including but not
            limited to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Processing and fulfilling your orders.</li>
            <li>Providing customer support and resolving queries.</li>
            <li>Sending updates about your order or offers (if opted in).</li>
            <li>Improving user experience and website performance.</li>
            <li>Ensuring the security of your account and transactions.</li>
          </ul>
        </section>

        {/* 3. Data Security */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            3. Data Security
          </h2>
          <p>
            We use industry-standard encryption and security measures to protect
            your personal information. Our services are backed by{" "}
            <strong>Google Firebase</strong> and{" "}
            <strong>Razorpay’s secure payment infrastructure</strong> to ensure
            your data and transactions remain safe.
          </p>
        </section>

        {/* 4. Sharing Your Information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            4. Sharing Your Information
          </h2>
          <p>
            We do not sell, rent, or trade your personal information. However,
            we may share your data with trusted partners only to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Process payments (Razorpay).</li>
            <li>Store and manage user authentication (Firebase).</li>
            <li>Ship your products via third-party logistics partners.</li>
          </ul>
          <p className="mt-3">
            All third-party services we use comply with strict privacy and data
            protection standards.
          </p>
        </section>

        {/* 5. Cookies */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            5. Cookies
          </h2>
          <p>
            We use cookies to enhance your browsing experience. Cookies help us
            remember your preferences and provide relevant product
            recommendations. You can disable cookies in your browser settings,
            but some site features may not function properly as a result.
          </p>
        </section>

        {/* 6. Your Rights */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            6. Your Rights
          </h2>
          <p>You have full control over your personal data. You can:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access or update your account information at any time.</li>
            <li>Request deletion of your account and stored data.</li>
            <li>
              Opt out of marketing emails by clicking “Unsubscribe” at the
              bottom of any promotional email.
            </li>
          </ul>
        </section>

        {/* 7. Children's Privacy */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            7. Children’s Privacy
          </h2>
          <p>
            Our services are not directed to children under 13. We do not
            knowingly collect personal information from minors. If you believe a
            child has provided us with their data, please contact us immediately
            for deletion.
          </p>
        </section>

        {/* 8. Changes to This Policy */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. All changes will be
            reflected on this page with an updated revision date. Please review
            this policy regularly to stay informed.
          </p>
        </section>

        {/* 9. Contact Us */}
        <section>
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            9. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy or your data,
            please reach out to us:
          </p>
          <ul className="mt-2">
            <li>
              Email:{" "}
              <a
                href="mailto:support@shreeforstree.in"
                className="text-[#A96A5A] hover:underline"
              >
                shreyaguptasg856@gmail.com
              </a>
            </li>
            <li>
              Phone:{" "}
              <a
                href="tel:9752692260"
                className="text-[#A96A5A] hover:underline"
              >
                +91 97526 92260
              </a>
            </li>
          </ul>
        </section>

        <p className="text-sm text-[#A96A5A]/70 mt-10 text-center">
          Last updated on {new Date().toLocaleDateString("en-IN")}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
