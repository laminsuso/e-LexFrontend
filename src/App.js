import { Link } from "react-router-dom";
import Header from "./component/header";
import ImageText from "./component/imagetext";
import fst from "./images/imgtxt/fst.PNG"
import scnd from "./images/imgtxt/scnd.PNG"
import third from "./images/imgtxt/third.PNG"
import fourth from "./images/imgtxt/fourth.PNG"
function App() {
  return (
    <div className="max-w-[1440px] mx-auto">
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

    <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="hero-bg-pattern"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tighter">
                Securely <span className="gradient-text">Sign & Automate</span><br className="hidden md:block" /> Agreements in Minutes
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-600">
                E- Lex Signature is the all-in-one platform that transforms your digital agreements with unmatched security, intuitive automation, and transparent pricing. Accelerate your business and build lasting trust with every signature.
            </p>
            <div className="mt-10 flex justify-center items-center gap-4 flex-wrap">
                <a href={localStorage.getItem('user')?'/admin':'/join'} className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-purple-700 cta-button-primary">Get Started</a>
                <a href="/contact" className="bg-white text-slate-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-md border border-slate-200 hover:bg-slate-100 transition-colors">Request a Demo</a>
            </div>
            <div className="mt-16 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-4 border border-slate-200">
                    <img src="https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto/v1/secured-attachments/messaging_message/attachment/eabcb47ca22a502138147e297284b3b4-1754693147616/Dynamic%20Agreement%20Workflow.png?__cld_token__=exp=1754762780~hmac=e10f9e9bd274cf2c456bfc2f5295a6e03efb024db7d70d4b02cef68402944302" alt="E- Lex Signature Dashboard showing a seamless digital workflow" className="rounded-xl w-full h-auto" />
                </div>
            </div>
        </div>
    </section>

    <section className="py-12 bg-slate-100">
        <div className="container mx-auto px-6">
            <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">Trusted by over 10,000 innovative companies</p>
            <div className="mt-6 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-x-12">
                <img src="https://placehold.co/120x40/FFFFFF/CCCCCC?text=InnovateCorp" alt="InnovateCorp Logo" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
                <img src="https://placehold.co/120x40/FFFFFF/CCCCCC?text=QuantumLeap" alt="QuantumLeap Logo" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
                <img src="https://placehold.co/120x40/FFFFFF/CCCCCC?text=Strive" alt="Strive Logo" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
                <img src="https://placehold.co/120x40/FFFFFF/CCCCCC?text=ApexGlobal" alt="ApexGlobal Logo" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
                <img src="https://placehold.co/120x40/FFFFFF/CCCCCC?text=Momentum" alt="Momentum Logo" className="h-8 opacity-60 hover:opacity-100 transition-opacity" />
            </div>
        </div>
    </section>
    <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Tired of Agreement Gridlock?</h2>
                <p className="mt-4 text-lg text-slate-600">Traditional document processes are broken. They're slow, insecure, and create frustrating bottlenecks for your team and your customers. E- Lex Signature was built to eliminate these frustrations for good.</p>
            </div>
            <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
                {/* Pain Point 1 */}
                <div className="p-6">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-red-100 rounded-full">
                        <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">Rising E-Signature Fraud</h3>
                    <p className="mt-2 text-slate-600">Worried about deepfakes and forgeries? Basic e-signatures lack the robust identity verification needed for high-stakes agreements.</p>
                </div>
                {/* Pain Point 2 */}
                <div className="p-6">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-amber-100 rounded-full">
                        <svg className="h-8 w-8 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">Slow Manual Processes</h3>
                    <p className="mt-2 text-slate-600">Tired of clunky tools and endless follow-ups? Manual workflows slow down critical deals and create unnecessary work for your team.</p>
                </div>
                {/* Pain Point 3 */}
                <div className="p-6">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-purple-100 rounded-full">
                         <svg className="h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.87H8.25a3.375 3.375 0 00-3.285 2.87l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m15.562 0a2.25 2.25 0 01-2.25 2.25h-13.125a2.25 2.25 0 01-2.25-2.25m17.625 0L16.5 12.75M4.125 17.25L7.5 12.75m0 0l3.75 4.5M7.5 12.75l3.75-4.5M16.5 12.75l-3.75 4.5m3.75-4.5l-3.75-4.5M12 17.25v.007" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">Hidden Costs & Lock-in</h3>
                    <p className="mt-2 text-slate-600">Frustrated by confusing pricing with hidden fees and surprise renewal hikes? Your tools should support growth, not penalize it.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="features" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">An All-in-One Agreement Platform</h2>
                <p className="mt-4 text-lg text-slate-600">E- Lex Signature provides everything you need to manage the entire agreement lifecycle with unparalleled security, simplicity, and scale.</p>
            </div>
            <div className="mt-16 grid lg:grid-cols-2 gap-8">
                {/* Feature Column 1: Security */}
                <div className="p-6 rounded-xl feature-card bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">Advanced Security & Compliance</h3>
                    </div>
                    <ul className="mt-4 space-y-3 text-slate-600 list-inside">
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Qualified Electronic Signatures (QES)</strong> for maximum legal weight.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>AI-Powered Identity Verification</strong> to combat modern fraud.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Blockchain Timestamping</strong> for immutable proof of existence.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Tamper-Proof Audit Trails</strong> with cryptographic seals.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Global Compliance</strong> (HIPAA, GDPR, SOC 2 Type II, etc.).</li>
                    </ul>
                </div>
                {/* Feature Column 2: Workflows */}
                <div className="p-6 rounded-xl feature-card bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">Streamlined Workflows & Usability</h3>
                    </div>
                    <ul className="mt-4 space-y-3 text-slate-600 list-inside">
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Intuitive Drag-and-Drop</strong> interface for all users.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Unlimited Reusable Templates</strong> & bulk sending.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>No-Code Automated Workflows</strong> with conditional logic.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Real-time Tracking</strong> and automated reminders.</li>
                        <li className="flex items-start"><span className="text-purple-500 mr-2 mt-1">&#10003;</span> <strong>Integrated Payment Collection</strong> within documents.</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="pr-8">
                    <span className="text-purple-600 font-semibold">THE E- LEX SIGNATURE DIFFERENCE</span>
                    <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">Pricing and Support That Puts You First</h2>
                    <p className="mt-4 text-lg text-slate-600">We believe in building partnerships, not just processing transactions. That's why we've built our business model around transparency, flexibility, and a genuine commitment to your success.</p>
                    <div className="mt-8 space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">✓</div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Transparent & Flexible Pricing</h4>
                                <p className="text-slate-600">No hidden costs, no renewal rate hikes, and no per-user overcharges. Choose a plan that truly fits your needs.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">✓</div>
                            <div>
                                <h4 className="font-semibold text-slate-900">White-Labeling & Custom Branding</h4>
                                <p className="text-slate-600">Provide a consistent, on-brand experience for your signers with full customization of logos and email communications.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">✓</div>
                            <div>
                                <h4 className="font-semibold text-slate-900">Dedicated Customer Support</h4>
                                <p className="text-slate-600">Get accessible, expert support from real humans who are invested in helping you from setup to troubleshooting.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-100 p-8 rounded-2xl">
                    <img src="https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto/v1/secured-attachments/messaging_message/attachment/eabcb47ca22a502138147e297284b3b4-1754693147607/Transparent%20Pricing%20Model.png?__cld_token__=exp=1754762780~hmac=c92e1f79ea157d83e9e8e5336874f4b409452479338311dd37f247d321beb146" alt="Illustration of a clear and simple pricing chart" className="rounded-xl shadow-lg w-full h-auto" />
                </div>
            </div>
        </div>
    </section>

    <section id="use-cases" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Powering Every Department</h2>
                <p className="mt-4 text-lg text-slate-600">From sales contracts to HR onboarding, E- Lex Signature is flexible enough to streamline agreement workflows across your entire organization.</p>
            </div>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
                <div className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-purple-100 rounded-full"><span className="text-3xl">📈</span></div>
                    <h3 className="mt-4 font-semibold text-slate-900">Sales Contracts</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-cyan-100 rounded-full"><span className="text-3xl">🤝</span></div>
                    <h3 className="mt-4 font-semibold text-slate-900">HR Onboarding</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-emerald-100 rounded-full"><span className="text-3xl">⚖️</span></div>
                    <h3 className="mt-4 font-semibold text-slate-900">Legal Compliance</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-amber-100 rounded-full"><span className="text-3xl">🏠</span></div>
                    <h3 className="mt-4 font-semibold text-slate-900">Real Estate</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex justify-center items-center h-16 w-16 mx-auto bg-rose-100 rounded-full"><span className="text-3xl">🛒</span></div>
                    <h3 className="mt-4 font-semibold text-slate-900">Procurement</h3>
                </div>
            </div>
        </div>
    </section>

   

    <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
                <img src="https://placehold.co/120x30/CCCCCC/FFFFFF?text=G2+Top+Performer" alt="Award logo" className="mx-auto h-12" />
                <h2 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">Don't Just Take Our Word For It</h2>
                <p className="mt-4 text-lg text-slate-600">See how leading companies have transformed their business with E- Lex Signature.</p>
            </div>
            <div className="mt-16 grid lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                    <p className="text-slate-700">"E-Lex Signature cut our sales cycle time by 40%. The API was incredibly easy to integrate with Salesforce, and our deal-close rate has never been higher. It’s a game-changer."</p>
                    <div className="mt-6 flex items-center gap-4">
                        <img className="h-12 w-12 rounded-full" src="https://placehold.co/48x48/E0E7FF/4F46E5?text=AS" alt="Avatar" />
                        <div>
                            <p className="font-semibold text-slate-900">Amanda S.</p>
                            <p className="text-slate-500">VP of Sales, InnovateCorp</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                    <p className="text-slate-700">"The level of security and compliance is unmatched. With QES and blockchain timestamping, I have complete confidence in the integrity of our most critical legal agreements."</p>
                    <div className="mt-6 flex items-center gap-4">
                        <img className="h-12 w-12 rounded-full" src="https://placehold.co/48x48/E0E7FF/4F46E5?text=MJ" alt="Avatar" />
                        <div>
                            <p className="font-semibold text-slate-900">Michael J.</p>
                            <p className="text-slate-500">General Counsel, ApexGlobal</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                    <p className="text-slate-700">"We automated over 20 manual workflows in the first month. The intuitive interface meant our team needed almost no training. The time savings are immense."</p>
                    <div className="mt-6 flex items-center gap-4">
                        <img className="h-12 w-12 rounded-full" src="https://placehold.co/48x48/E0E7FF/4F46E5?text=CD" alt="Avatar" />
                        <div>
                            <p className="font-semibold text-slate-900">Chen D.</p>
                            <p className="text-slate-500">Director of Operations, Strive</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section className="bg-white">
        <div className="container mx-auto px-6 py-20 md:py-24">
            <div className="bg-purple-600 rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/50 rounded-full"></div>
                <div className="absolute -top-16 -right-10 w-56 h-56 bg-purple-500/50 rounded-full"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Revolutionize Your Agreements?</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-purple-200">Join thousands of businesses that trust E- Lex Signature to secure and accelerate their most important documents. Get started in minutes.</p>
                    <div className="mt-8 flex justify-center items-center gap-4 flex-wrap">
                        <a href="#" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-slate-100 transition-colors">Get Started</a>
                        <a href="/contact" className="bg-purple-500 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-md border border-purple-400 hover:bg-purple-400 transition-colors">Request a Demo</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer className="bg-slate-900 text-slate-400">
        <div className="container mx-auto px-6 py-16">
            <div className="grid md:grid-cols-5 gap-8">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center space-x-3">
                        <img src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png" alt="E- Lex Signature Logo" className="h-8 w-8 transform -rotate-6 filter invert brightness-0" />
                        <span className="text-2xl font-bold text-white">E-Lex Signature</span>
                    </div>
                    <p className="mt-4 text-sm">The future of secure digital agreements.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-white tracking-wider uppercase">Product</h4>
                    <ul className="mt-4 space-y-3">
                        <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-white tracking-wider uppercase">Solutions</h4>
                    <ul className="mt-4 space-y-3">
                        <li><a href="#" className="hover:text-white transition-colors">Sales</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">HR</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Real Estate</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-white tracking-wider uppercase">Resources</h4>
                    <ul className="mt-4 space-y-3">
                        <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Support Center</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-white tracking-wider uppercase">Company</h4>
                    <ul className="mt-4 space-y-3">
                        <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                    </ul>
                </div>
            </div>
            <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm">&copy; 2024 E- Lex Signature, Inc. All rights reserved.</p>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </div>
            </div>
        </div>
    </footer>

      </div>
  );
}

export default App;
