import React from "react";
import Slider from "../common/Slider";

const HomeTop = () => {
  const slides = ["/Banner/img1.png", "/Banner/img2.jpg", "/Banner/img3.png"];
  return (
    <div>
      <div className="p-4 flex flex-col justify-center items-center overflow-hidden select-none">
        <Slider slides={slides} />
      </div>
    </div>
  );
};

export default HomeTop;
