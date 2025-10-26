import React, { useState } from "react";
import { motion } from "motion/react";
import Icons from "../assets/Icons/Icons";

const Contact = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Simple email validation regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailPattern.test(value)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };
  return (
    <div className="min-h-screen bg-[#F5D3C3] flex flex-col items-center justify-center px-[2vw] lg:px-[8vw] py-[4vw] lg:py-[6vw] text-[#A96A5A]">
      {/* Intro Section */}
      <motion.div
        className="text-center mb-[5vh]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-xl lg:text-4xl uppercase font-light tracking-[.7vw] lg:tracking-[0.4vw]">
          Let’s create something beautiful together
        </h1>
        <p className="text-base mt-3 font-light tracking-wide text-[#8B4E3E]">
          Whether you’re looking for a custom fit, order assistance, or just
          want to talk fabrics — we’re all ears.
        </p>
      </motion.div>

      {/* Contact Details */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-10 w-full max-w-[80vw] text-center place-items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Email */}
        <div className="flex flex-col items-center justify-center gap-1 lg:gap-3 mr-3 lg:mr-0">
          <Icons.UserIcon className="text-[#A96A5A] h-[25px] lg:h-[38px] lg:w-[38px]" />
          <h3 className="font-medium text-base lg:text-lg tracking-[0.15vw]">
            Email
          </h3>
          <a
            href="mailto:shreyaguptasg856@gmail.com"
            className="text-[2.5vw] lg:text-base font-light hover:text-[#8B4E3E] transition-colors"
          >
            shreyaguptasg856@gmail.com
          </a>
        </div>

        {/* Phone */}
        <div className="flex flex-col items-center justify-center gap-1 lg:gap-3 ml-[1.7vw] lg:ml-0">
          <Icons.PhoneIcon className="text-[#A96A5A] h-[25px] lg:h-[38px] lg:w-[38px]" />
          <h3 className="font-medium text-base lg:text-lg tracking-[0.15vw]">
            Phone
          </h3>
          <a href="tel:9752692260">
            <p className="text-[2.5vw] lg:text-base font-light hover:text-[#8B4E3E] transition-colors">
              +91 97526 92260
            </p>
          </a>
        </div>

        {/* Instagram */}
        <div className="col-span-2 lg:col-span-1 flex flex-col items-center justify-center gap-1 lg:gap-3">
          <Icons.InstaIcon className="text-[#A96A5A] h-[25px] lg:h-[38px] lg:w-[38px]" />
          <h3 className="font-medium text-base lg:text-lg tracking-[0.15vw]">
            Instagram
          </h3>
          <a
            href="https://www.instagram.com/shreeforstree"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[2.5vw] lg:text-base font-light hover:text-[#8B4E3E] transition-colors"
          >
            @shreeforstree
          </a>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="w-full lg:w-[60vw] h-[1px] bg-[#A96A5A]/40 my-[5vh]" />

      {/* Contact Form */}
      <motion.form
        className="w-full max-w-[85vw] lg:max-w-[50vw] flex flex-col gap-8 lg:gap-5"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          <label className="text-base lg:text-sm uppercase tracking-[0.2vw] mb-1 font-light">
            Name
          </label>
          <input
            type="text"
            placeholder="Your full name"
            className="p-2 border border-[#A96A5A]/40 rounded-md bg-transparent outline-none focus:border-[#A96A5A] transition-all duration-300"
          />
        </div>

        <div className="flex flex-col relative">
          <label className="text-base lg:text-sm uppercase tracking-[0.2vw] mb-1 font-light">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="your@email.com"
            className={`p-2 border rounded-md bg-transparent outline-none transition-all duration-300 ${
              emailError
                ? "border-red-500 focus:border-red-600"
                : "border-[#A96A5A]/40 focus:border-[#A96A5A]"
            }`}
          />
          {emailError && (
            <span className="text-red-500 text-xs mt-1 absolute -bottom-5">
              {emailError}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <label className="text-base lg:text-sm uppercase tracking-[0.2vw] mb-1 font-light">
            Message
          </label>
          <textarea
            rows="5"
            placeholder="Write your message..."
            className="p-3 lg:p-2 border border-[#A96A5A]/40 rounded-md bg-transparent outline-none focus:border-[#A96A5A] transition-all duration-300 resize-y"
          ></textarea>
        </div>

        <motion.button
          type="submit"
          disabled={!!emailError || !email}
          whileHover={{ scale: emailError ? 1 : 1.05 }}
          whileTap={{ scale: emailError ? 1 : 0.95 }}
          className={`mt-4 border py-2 rounded-md uppercase tracking-[0.25vw] font-light 
              relative overflow-hidden group transition-all duration-300
              ${
                emailError
                  ? "border-gray-400 text-gray-400 cursor-not-allowed"
                  : "border-[#A96A5A] text-[#A96A5A]"
              }`}
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">
            Send Message
          </span>
          {!emailError && (
            <span className="absolute inset-0 bg-[#A96A5A] scale-x-0 origin-center group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
          )}
        </motion.button>
      </motion.form>

      {/* Footer Text */}
      <motion.p
        className="mt-[8vh] text-sm italic text-[#8B4E3E] font-light tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        We usually respond within 24 hours 💌
      </motion.p>
    </div>
  );
};

export default Contact;
