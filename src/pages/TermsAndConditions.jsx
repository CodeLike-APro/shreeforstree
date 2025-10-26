import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f7] to-[#fff] flex justify-center px-1 lg:px-6 py-7 lg:py-12">
      <div className="max-w-4xl bg-white rounded-xl shadow-md border border-[#EAD8D2]/70 text-[#7B6A65] leading-relaxed px-4 py-8 lg:px-8 lg:py-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-[#A96A5A] mb-6 tracking-[.7vw] lg:tracking-[.2vw]">
          Terms & Conditions
        </h1>

        <p className="mb-6">
          Welcome to <strong>Shree For Stree</strong>. By using our website and
          placing an order, you agree to comply with and be bound by the
          following Terms and Conditions. Please read them carefully before
          using our services.
        </p>

        {/* 1. General */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            1. General
          </h2>
          <p>
            These Terms govern your use of our website and services. By
            accessing or making a purchase, you confirm that you are at least 18
            years old (or have parental consent) and agree to these Terms and
            our Privacy Policy.
          </p>
        </section>

        {/* 2. Product Information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            2. Product Information
          </h2>
          <p>
            We strive to display accurate product descriptions, colors, and
            prices. However, slight variations may occur due to differences in
            screen settings, lighting, or availability. All prices are listed in
            Indian Rupees (INR) and include applicable taxes unless stated
            otherwise.
          </p>
        </section>

        {/* 3. Orders & Payments */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            3. Orders & Payments
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Orders are confirmed only after full payment is successfully
              received via our secure payment gateway (<strong>Razorpay</strong>
              ).
            </li>
            <li>
              In case of payment failure or technical error, we are not liable
              for any resulting delay or non-processing of your order.
            </li>
            <li>
              We reserve the right to cancel or refuse any order if fraudulent
              activity or incorrect pricing is suspected.
            </li>
          </ul>
        </section>

        {/* 4. Shipping & Delivery */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            4. Shipping & Delivery
          </h2>
          <p>
            Orders are usually processed within 2–4 business days. Delivery time
            may vary depending on your location. Once shipped, you will receive
            a tracking link via email or SMS. Please ensure your shipping
            details are accurate to avoid delivery issues.
          </p>
        </section>

        {/* 5. Returns & Exchanges */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            5. Returns & Exchanges
          </h2>
          <p>
            Due to hygiene and customization reasons, we currently do not accept
            returns or exchanges unless the product is defective or damaged upon
            arrival. Please contact us within 48 hours of delivery for
            assistance at{" "}
            <a
              href="mailto:support@shreeforstree.in"
              className="text-[#A96A5A] hover:underline"
            >
              support@shreeforstree.in
            </a>
            .
          </p>
        </section>

        {/* 6. Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            6. Intellectual Property
          </h2>
          <p>
            All website content — including text, graphics, logos, product
            photos, and design — is the property of{" "}
            <strong>Shree For Stree</strong> and protected under copyright law.
            Unauthorized use, reproduction, or redistribution is strictly
            prohibited.
          </p>
        </section>

        {/* 7. Account Responsibility */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            7. Account Responsibility
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            login credentials. Any activity under your account will be deemed as
            authorized by you. If you suspect unauthorized access, notify us
            immediately.
          </p>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            8. Limitation of Liability
          </h2>
          <p>
            While we take every step to ensure a smooth shopping experience,{" "}
            <strong>Shree For Stree</strong> shall not be held liable for any
            indirect, incidental, or consequential damages resulting from the
            use of our website or products.
          </p>
        </section>

        {/* 9. Updates to Terms */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            9. Updates to Terms
          </h2>
          <p>
            We may update these Terms & Conditions from time to time. Any
            changes will be reflected on this page, and continued use of the
            website implies acceptance of the revised terms.
          </p>
        </section>

        {/* 10. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-[#A96A5A] mb-2">
            10. Contact Us
          </h2>
          <p>
            For any questions or concerns regarding these Terms, please contact
            us at:
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

export default TermsAndConditions;
