import React from "react";
import { Link } from "react-router-dom";
import Icons from "../../assets/Icons/Icons";

const Footer = () => {
  return (
    <footer
      id="site-footer"
      className="bg-gradient-to-t from-[#A96A5A] to-[#8B5548] text-[#F5D3C3] pt-[2vh] pb-[17vh] px-[3vw] lg:pt-[10vh] lg:pb-[10vh] lg:px-[8vw] flex flex-wrap justify-between items-start gap-[7vh] lg:gap-[4.5vw] relative leading-relaxed"
    >
      {/* Contact Section */}
      <div className="contact flex flex-col gap-[1.5vh] lg:w-[25vw] ">
        <h2 className="text-[7vw] lg:text-[1.9vw] lg:font-semibold tracking-[0.5vw] lg:tracking-[0.05vw]">
          Say Hello to Shree
        </h2>
        <ul className="mt-[2vh] lg:mt-[2.2vh] flex flex-col gap-[0.7vh] lg:gap-[1.2vh] text-[4vw] lg:text-[1.05vw]">
          <li>
            <span className="font-semibold">Email:</span>{" "}
            <a
              href="mailto:shreyaguptasg856@gmail.com"
              className="hover:underline underline-offset-4 tracking-[0.2vw] lg:tracking-[0vw]"
            >
              shreyaguptasg856@gmail.com
            </a>
          </li>
          <li>
            <span className="font-semibold">Mob:</span>
            <a
              href="tel:9752692260"
              className="hover:underline underline-offset-4 tracking-[0.2vw] lg:tracking-[0vw]"
            >
              {" "}
              +91 97526 92260
            </a>
          </li>
          <li className="tracking-[0.2vw] lg:tracking-[0vw]">
            <span className="font-semibold">Address:</span> Chirgaon, Jhansi
          </li>
        </ul>

        {/* Socials */}
        <h3 className="w-full flex items-center justify-start text-[#F5D3C3] uppercase tracking-[0.5vw] text-[1.2vw] font-light gap-4 my-0">
          <a
            href="https://www.instagram.com/shreeforstree"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icons.InstaIcon className="mt-2 lg:mt-1 h-[35px] lg:h-[30px] w-[35px] lg:w-[30px]" />
          </a>
          <a
            className="relative after:absolute after:left-1/2 after:-bottom-1 after:h-[2px] after:bg-[#F5D3C3] 
                 after:w-0 hover:after:w-full after:translate-x-[-50%] after:transition-all after:duration-200"
            href="https://www.instagram.com/shreeforstree"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icons.InstaID className="h-[50px] w-[150px] lg:h-[50px] lg:w-[150px]" />
          </a>
        </h3>
      </div>

      {/* Policies */}
      <div className="contact flex flex-col gap-[1.5vh] lg:w-[25vw] ">
        <h2 className="text-[7vw] lg:text-[1.9vw] lg:font-semibold tracking-[0.5vw] lg:tracking-[0.05vw]">
          Our Promise to You
        </h2>
        <ul className="mt-[2vh] lg:mt-[2.2vh] flex flex-col gap-[0.7vh] lg:gap-[1.2vh] text-[4vw] lg:text-[1.05vw] tracking-[0.2vw] lg:tracking-[0vw]">
          <li>
            <Link to="/PrivacyPolicy" className="hover:underline ">
              Privacy Policy
            </Link>
          </li>
          <li>
            <a href="/return-policy" className="hover:underline">
              Return & Exchange
            </a>
          </li>
          <li>
            <a href="/shipping-policy" className="hover:underline">
              Shipping & Delivery
            </a>
          </li>
          <li>
            <Link to="/TermsAndConditions" className="hover:underline">
              Terms & Conditions
            </Link>
          </li>
        </ul>
      </div>

      {/* Support */}
      <div className="contact flex flex-col gap-[1.5vh] lg:w-[25vw] ">
        <h2 className="text-[7vw] lg:text-[1.9vw] lg:font-semibold tracking-[0.5vw] lg:tracking-[0.05vw]">
          Need Some Help?
        </h2>
        <ul className="mt-[2vh] lg:mt-[2.2vh] flex flex-col gap-[0.7vh] lg:gap-[1.2vh] text-[4vw] lg:text-[1.05vw] tracking-[0.2vw] lg:tracking-[0vw]">
          <li>
            <Link to="/faqs" className="hover:underline">
              FAQs
            </Link>
          </li>
          <li>
            <a href="/track-order" className="hover:underline">
              Track Your Order
            </a>
          </li>
          <li>
            <Link to={"/contact"}>
              <p className="hover:underline">Customer Support</p>
            </Link>
          </li>
          <li>
            <a href="/size-guide" className="hover:underline">
              Size Guide
            </a>
          </li>
        </ul>
      </div>

      {/* Bottom Credits */}
      <div className="absolute bottom-[10.5vh] lg:bottom-[2vh] lg:left-0 w-full text-center text-[3vw] lg:text-[1vw] opacity-75">
        © {new Date().getFullYear()} Shree for Stree. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
