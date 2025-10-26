import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Icons from "../assets/Icons/Icons";

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How can I place an order?",
      answer:
        "Simply browse our products, add your favorite items to the cart, and proceed to checkout. You can complete your purchase securely using Razorpay or other available payment options.",
    },
    {
      question: "Do I need an account to place an order?",
      answer:
        "Yes. You’ll need to sign in or create an account before placing an order. This ensures your orders, addresses, and payment details are securely stored and helps you easily track deliveries.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept secure online payments through Razorpay, including UPI, Debit/Credit Cards, Net Banking, and major digital wallets.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Orders are typically processed within 2–4 business days. Delivery times vary by location but generally take between 5–9 working days after dispatch.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order is shipped, you’ll receive a tracking link via email or SMS. You can also view your order status in the 'My Orders' section after logging into your account.",
    },
    {
      question: "Can I cancel or modify my order?",
      answer:
        "Orders can only be canceled or modified before they are shipped. Once an order is dispatched, we cannot make any changes. For assistance, contact us at shreyaguptasg856@gmail.com.",
    },
    {
      question: "Do you offer returns or exchanges?",
      answer:
        "Currently, we do not accept returns or exchanges unless the item is defective or damaged upon delivery. Please report any issues within 48 hours of receiving your order.",
    },
    {
      question: "Is my personal information safe?",
      answer:
        "Absolutely. We use secure servers, encryption, and trusted partners like Firebase and Razorpay to ensure that your personal and payment information remains private and protected.",
    },
    {
      question: "What should I do if my payment fails?",
      answer:
        "In case of a failed payment, please try again after verifying your payment details. If the amount has been deducted but your order isn’t confirmed, it will be refunded automatically within 5–7 business days.",
    },
    {
      question: "How can I contact customer support?",
      answer:
        "You can reach us anytime at shreyaguptasg856@gmail.com or call us at +91 97526 92260. We’ll respond to your queries as soon as possible.",
    },
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f7] to-[#fff] flex justify-center px-1 lg:px-6 py-7 lg:py-12">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-md border border-[#EAD8D2]/70 px-4 py-8 lg:px-8 lg:py-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-[#A96A5A] mb-6 text-center">
          Frequently Asked Questions
        </h1>

        <p className="text-[#7B6A65] text-center mb-10 max-w-2xl mx-auto">
          Got questions? We’ve got answers. Find quick help for the most common
          queries about your orders, payments, and account.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-[#EAD8D2] rounded-lg overflow-hidden bg-[#FFF9F8]"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left px-5 py-4 text-[#A96A5A] font-medium focus:outline-none"
              >
                <span>{faq.question}</span>
                <motion.span
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icons.DownIcon className="w-5 h-5 text-[#A96A5A]" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-4 text-sm text-[#7B6A65]/90 leading-relaxed bg-white"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <p className="text-sm text-[#A96A5A]/70 mt-10 text-center">
          Still have questions? Reach out to us at{" "}
          <a
            href="mailto:support@shreeforstree.in"
            className="text-[#A96A5A] hover:underline"
          >
            shreyaguptasg856@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default FAQs;
