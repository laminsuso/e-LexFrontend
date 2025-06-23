import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import tick from "./images/tick.png";
import { BASE_URL } from "./baseUrl";
import { useNavigate } from "react-router-dom";
import Header from "./component/header";

export default function Pricing() {
    const [pricingType, setPricingType] = useState("monthly");
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
const navigate=useNavigate();
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${BASE_URL}/get-plans`, {
                    headers: { authorization: `Bearer ${token}` }
                });
                
                // Convert Decimal128 prices to numbers
                const convertedPlans = res.data.plans.map(plan => ({
                    ...plan,
                    price: plan.price?.$numberDecimal ? 
                        parseFloat(plan.price.$numberDecimal) : 
                        plan.price
                }));
                
                setPlans(convertedPlans);
                setLoading(false);
            } catch (error) {
                toast.error("Failed to load plans", { containerId: "pricing" });
                setLoading(false);
            }
        };
        
        fetchPlans();
    }, []);

    const handleSubscribe = async (planId) => {
        try {
           navigate(`/subscription?planId=${planId}`)
        } catch (error) {
            const message = error.response?.data?.error || "Subscription failed";
            toast.error(message, { containerId: "pricing" });
        }
    };

    const filteredPlans = (type) => {
        const filtered = plans.filter(plan => plan.billingCycle === type);
        return filtered.slice(0, 4); // Limit to max 4 plans
    };

    const renderPlanCard = (plan, index) => (
        <div key={plan._id} className="flex flex-col text-center border-collapse border-[1px] border-gray-300 w-full bg-white">
            <div className="p-2 flex flex-col justify-center items-center">
                <h1 className="uppercase text-lg font-bold">{plan.name}</h1>
                <div className="w-[120px] h-[120px] overflow-hidden mt-4">
                    <img 
                        className="w-full h-full object-contain" 
                        src={getPlanImage(index)} 
                        alt={plan.name} 
                    />
                </div>
                <div className="text-3xl font-semibold mt-4">
                    ${plan.price}/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                    <p>{plan.numberOfSigns} signatures</p>
                    <p>{plan.numberOfEmails} emails</p>
                </div>
                <button 
                    onClick={() => handleSubscribe(plan._id)}
                    className="bg-[#002864] rounded-[20px] w-full text-white py-3 mt-4 cursor-pointer hover:bg-[#001a4a] transition-colors"
                >
                    Choose Plan
                </button>
            </div>
            <hr className="w-full bg-gray-300 h-[0.5px] my-4" />
            <div className="mx-4 pb-4 text-left">
                <div className="text-sm flex items-center gap-2 mb-2">
                    <img src={tick} alt="Included" className="w-4 h-4" />
                    {plan.numberOfSigns} signatures per month
                </div>
                <div className="text-sm flex items-center gap-2 mb-2">
                    <img src={tick} alt="Included" className="w-4 h-4" />
                    {plan.numberOfEmails} email validations
                </div>
                <div className="text-sm flex items-center gap-2 mb-2">
                    <img src={tick} alt="Included" className="w-4 h-4" />
                    24/7 Support
                </div>
            </div>
        </div>
    );

    const getPlanImage = (index) => {
        const planImages = [
            'https://app.opensignlabs.com/static/media/free.acf92ef73b7180fe7202.png',
            'https://app.opensignlabs.com/static/media/teams.2fee804949169a9b5e08.png',
            'https://app.opensignlabs.com/static/media/enterprise.b82600eced022809e1c4.png'
        ];
        return planImages[index] || 'https://via.placeholder.com/120x120';
    };

    return (
        <div className="lg:px-[64px] lg:pt-[40px] px-[20px] py-[20px] devbg lg:pb-[10px] bg-[#e5e7eb] min-h-screen">
            <ToastContainer containerId="pricing" />
            <Header /> 
            <div className="w-full max-w-[1440px] my-5 mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Pricing Plans</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white rounded-full p-1">
                            <button
                                className={`px-4 py-2 rounded-full ${
                                    pricingType === 'monthly' 
                                        ? 'bg-[#002864] text-white' 
                                        : 'text-gray-600'
                                }`}
                                onClick={() => setPricingType('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full ${
                                    pricingType === 'yearly' 
                                        ? 'bg-[#002864] text-white' 
                                        : 'text-gray-600'
                                }`}
                                onClick={() => setPricingType('yearly')}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading plans...</div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {filteredPlans(pricingType).length === 0 ? (
                            <div className="col-span-full text-center py-8 text-gray-600">
                                No plans available for {pricingType} billing cycle
                            </div>
                        ) : (
                            filteredPlans(pricingType).map((plan, index) => renderPlanCard(plan, index))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}