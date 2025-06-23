import { Link } from "react-router-dom";
import Header from "./component/header";
import img1 from "./images/imgtxt/fst.PNG";
import img2 from "./images/imgtxt/scnd.PNG";
import img3 from "./images/imgtxt/third.PNG";

function App() {
  return (
    <div className="lg:px-[64px] lg:pt-[40px] px-[20px] py-[20px] lg:pb-[10px] devbg  bg-[#1C024D] text-white min-h-screen">
      <Header />

    
      <div className="text-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          We Empower Business
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          We're dedicated to helping our clients achieve their goals.
        </p>
        <Link
          to="/contact"
          className="inline-block bg-white text-black font-semibold px-8 py-3 rounded hover:bg-gray-200 transition"
        >
          Learn More
        </Link>
      </div>

     
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[5rem] max-w-[1440px] mx-auto px-6 md:px-12 pb-20">
        <div className=" text-white rounded overflow-hidden shadow-md">
          <img src={img1} alt="Proven Track Record" className="w-full rounded-[12px] aspect-square object-cover" />
          <div className="p-6">
            <h3 className="font-bold text-lg xl:text-[26px] text-center  mb-[2rem]">Proven Track Record</h3>
            <p className="text-center text-[16px] xl:text-[18px]">
              We have a history of success in helping our clients achieve their goals.
            </p>
          </div>
        </div>

        <div className=" text-white rounded overflow-hidden shadow-md">
          <img src={img2} alt="Forward-Thinking Approach" className="w-full rounded-[12px] aspect-square object-cover" />
          <div className="p-6">
            <h3 className="font-bold text-lg xl:text-[26px] text-center  mb-[2rem]">Forward-Thinking Approach</h3>
            <p className="text-center text-[16px] xl:text-[18px]">
              We are constantly innovating to stay ahead of the curve.
            </p>
          </div>
        </div>

        <div className=" text-white rounded overflow-hidden shadow-md">
          <img src={img3} alt="Trusted Partnership" className="w-full rounded-[12px] aspect-square object-cover" />
          <div className="p-6">
            <h3 className="font-bold text-lg xl:text-[26px] text-center  mb-[2rem]">Trusted Partnership</h3>
            <p className="text-center text-[16px] xl:text-[18px]">
              We believe in building strong, long-term relationships with our clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
