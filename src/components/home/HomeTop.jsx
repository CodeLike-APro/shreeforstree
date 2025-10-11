import React from "react";
import Slider from "../common/Slider";

const HomeTop = () => {
  const slides = ["/images/img1.png", "/images/img2.jpg", "/images/img3.png"];
  return (
    <div>
      <div className="p-4 flex flex-col justify-center items-center overflow-hidden">
        <Slider slides={slides} />
      </div>
    </div>
  );
};

export default HomeTop;
