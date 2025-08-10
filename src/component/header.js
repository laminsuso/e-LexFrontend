import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Header() {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
         <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <img src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png" alt="E- Lex Signature Logo" className="h-8 w-8 transform -rotate-6" />
                <span className="text-2xl font-bold text-slate-900">E-Lex Signature</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              
                <a href="/" className="text-slate-600 hover:text-purple-600 transition-colors">Home</a>
                <a href="/pricing" className="text-slate-600 hover:text-purple-600 transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center space-x-4">
                <a href="/join" className="hidden sm:block text-slate-600 font-medium hover:text-purple-600 transition-colors">Log In</a>
                <a href={localStorage.getItem('user')?'/admin':'/join'} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-purple-700 cta-button-primary">Get started</a>
            </div>
        </div>
    </header>
        </>
    )
}