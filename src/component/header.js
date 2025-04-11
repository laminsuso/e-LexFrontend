import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Header() {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="w-full flex justify-between items-center py-[10px] lg:px-[20px] px-[10px] relative">

            <a href="/" className="max-w-[250px] flex gap-2 justify-center items-center">
                <img className="h-8" src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png" alt="logo"  />
            E-Lex Signature
            </a>
            <div className="hidden md:flex gap-[20px] items-center">
                <Link to="/" className={`hover:text-[#f37765] transition-colors ${currentPath === "/" ? "text-[#3d9be9]" : "text-gray-800"}`}>
                    Home
                </Link>

                <Link to="/pricing" className={`hover:text-[#f37765] transition-colors ${currentPath === "/pricing" ? "text-[#3d9be9]" : "text-gray-800"}`}>
                    Pricing
                </Link>
            </div>

            <div className="hidden md:flex gap-[20px] items-center">

                <Link to="/join" className="group shadow-lg flex gap-[20px] items-center bg-[#FF4040] font-bold py-[5px] cursor-pointer px-[20px] rounded-[15px] hover:rounded-[20px] text-white">
                    <svg className=" group-hover:h-[30px] group-hover:w-[30px] h-[26px] w-[26px]" data-bbox="1.485 1.407 252.744 252.901" viewBox="0 0 256 256" height="256" width="256" xmlns="http://www.w3.org/2000/svg" data-type="ugc">
                        <g stroke-width="0" stroke-miterlimit="10">
                            <path d="M164.73 30.004C200.158 4.8 233.53-5.368 249.544 6.091c11.46 16.014 1.293 49.389-23.913 84.814l-60.901-60.9z" fill="#ffffff"></path>
                            <path d="M94.64 191.267c-6.986 23.444-43.712 22.222-72.942 42.836 20.614-29.23 19.386-65.959 42.83-72.947l30.112 30.111z" fill="#ffffff"></path>
                            <path d="M124.266 202.564c14.477-7.497 30.002-18.052 45.438-31.06.056-.025.112-.055.168-.08l-10.43 53.962a11.56 11.56 0 0 1-3.176 5.98l-21.83 21.831c-2.28 2.279-6.18.837-6.427-2.374l-3.743-48.26z" fill="#ffffff"></path>
                            <path d="m30.406 96.351 53.35-10.312c-12.905 15.35-23.384 30.783-30.839 45.176l.312.312-48.259-3.743c-3.212-.25-4.653-4.15-2.374-6.427l21.83-21.83a11.54 11.54 0 0 1 5.98-3.176z" fill="#ffffff"></path>
                            <path d="m154.954 38.558 61.969 61.969c-9.754 14.314-21.921 29.044-36.128 43.251-21.803 21.803-44.84 38.823-65.695 49.622l-53.02-53.022c10.8-20.855 27.82-43.895 49.622-65.695 14.208-14.207 28.94-26.374 43.252-36.125zM138.79 116.69c7.435 7.435 19.487 7.435 26.922 0 7.436-7.435 7.436-19.487 0-26.923-7.435-7.435-19.487-7.435-26.922 0-7.436 7.436-7.436 19.488 0 26.923z" fill="#ffffff"></path>
                        </g>
                    </svg>
                    Get Started
                </Link>
            </div>


            <button
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>


            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
            )}


            <div className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300
                ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} md:hidden`}
            >
                <div className="p-6 flex flex-col gap-6">

                    <button
                        className="self-end"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        ✕
                    </button>


                    <Link
                        to="/"
                        className={`hover:text-[#f37765] ${currentPath === "/" ? "text-[#3d9be9]" : "text-gray-800"}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/resources"
                        className={`hover:text-[#f37765] ${currentPath === "/resources" ? "text-[#3d9be9]" : "text-gray-800"}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Resources
                    </Link>
                    <Link
                        to="/pricing"
                        className={`hover:text-[#f37765] ${currentPath === "/pricing" ? "text-[#3d9be9]" : "text-gray-800"}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Pricing
                    </Link>


                    <Link to="/join" className="group shadow-lg flex gap-4 items-center bg-[#FF4040] font-bold py-3 cursor-pointer px-4 rounded-[15px] hover:rounded-[20px] text-white mt-4">
                        <svg className=" group-hover:h-[30px] group-hover:w-[30px] h-[26px] w-[26px]" data-bbox="1.485 1.407 252.744 252.901" viewBox="0 0 256 256" height="256" width="256" xmlns="http://www.w3.org/2000/svg" data-type="ugc">
                            <g stroke-width="0" stroke-miterlimit="10">
                                <path d="M164.73 30.004C200.158 4.8 233.53-5.368 249.544 6.091c11.46 16.014 1.293 49.389-23.913 84.814l-60.901-60.9z" fill="#ffffff"></path>
                                <path d="M94.64 191.267c-6.986 23.444-43.712 22.222-72.942 42.836 20.614-29.23 19.386-65.959 42.83-72.947l30.112 30.111z" fill="#ffffff"></path>
                                <path d="M124.266 202.564c14.477-7.497 30.002-18.052 45.438-31.06.056-.025.112-.055.168-.08l-10.43 53.962a11.56 11.56 0 0 1-3.176 5.98l-21.83 21.831c-2.28 2.279-6.18.837-6.427-2.374l-3.743-48.26z" fill="#ffffff"></path>
                                <path d="m30.406 96.351 53.35-10.312c-12.905 15.35-23.384 30.783-30.839 45.176l.312.312-48.259-3.743c-3.212-.25-4.653-4.15-2.374-6.427l21.83-21.83a11.54 11.54 0 0 1 5.98-3.176z" fill="#ffffff"></path>
                                <path d="m154.954 38.558 61.969 61.969c-9.754 14.314-21.921 29.044-36.128 43.251-21.803 21.803-44.84 38.823-65.695 49.622l-53.02-53.022c10.8-20.855 27.82-43.895 49.622-65.695 14.208-14.207 28.94-26.374 43.252-36.125zM138.79 116.69c7.435 7.435 19.487 7.435 26.922 0 7.436-7.435 7.436-19.487 0-26.923-7.435-7.435-19.487-7.435-26.922 0-7.436 7.436-7.436 19.488 0 26.923z" fill="#ffffff"></path>
                            </g>
                        </svg>
                        Get Started
                    </Link>
                </div>
            </div>
        </div>
    )
}