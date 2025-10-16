import React from "react";
import { motion } from "motion/react";

const Categories = () => {
  return (
    <div>
      <div className="flex justify-center items-center text-6xl uppercase tracking-[1.1vw] text-[#A96A5A] mt-[2vw] mb-[1vw]">
        Categories
      </div>

      <motion.div
        className="flex justify-center gap-[2vw] p-[2vw] flex-wrap"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease: "easeOut" },
              },
            }}
            className="h-[70vh] w-[30vw] relative group bg-black overflow-hidden cursor-pointer"
          >
            <img
              className="object-cover h-full w-full transition-transform duration-700 group-hover:scale-110"
              src="/NewArrivals/img5.jpg"
              alt="Category"
            />
            <div className="absolute top-0 left-0 flex justify-center items-end h-full w-full bg-gradient-to-t from-black/70 to-black/20 transition-all duration-700 group-hover:bg-black/10">
              <h2 className="text-white text-3xl font-light tracking-[1vw] uppercase mb-[10vh] px-[1vw] py-[0.6vh] transition-all duration-700 group-hover:tracking-[0.5vw]">
                New Arrivals
              </h2>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Categories;
