import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { toast, ToastContainer } from "react-toastify";

const stripePromise = loadStripe(
  "pk_test_51OwuO4LcfLzcwwOYdssgGfUSfOgWT1LwO6ewi3CEPewY7WEL9ATqH6WJm3oAcLDA3IgUvVYLVEBMIEu0d8fUwhlw009JwzEYmV"
);

const SubscriptionFlow = () => {
  const navigate = useNavigate();
 // const location = useLocation();
  const [searchParams] = useSearchParams();

  const planId = searchParams.get("planId");

  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [plan, setPlan] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    jobTitle: "",
    billingAddress: "",
    country: "United States",
    state: "",
    city: "",
    zip: "",
    useSameAddress: true,
    coupon: "",
  });

  const token = useMemo(() => localStorage.getItem("token"), []);

  // If not signed in, redirect to login but KEEP context
  useEffect(() => {
    if (!planId) return; // handled below
    if (!token) {
      const next = encodeURIComponent(`/subscription?planId=${planId}`);
      navigate(`/join?mode=login&next=${next}`, { replace: true });
    }
  }, [navigate, planId, token]);

  // const validateStep = (step) => {
  //   switch (step) {
  //     case 2:
  //       if (!formData.firstName.trim()) return toast.error("First name is required", { containerId: "subscription" }), false;
  //       if (!formData.lastName.trim()) return toast.error("Last name is required", { containerId: "subscription" }), false;
  //       if (!formData.email.trim()) return toast.error("Email address is required", { containerId: "subscription" }), false;
  //       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  //         toast.error("Invalid email format", { containerId: "subscription" });
  //         return false;
  //       }
  //       if (!formData.phone.trim()) return toast.error("Mobile number is required", { containerId: "subscription" }), false;
  //       return true;

  //     case 3:
  //       if (!formData.billingAddress.trim()) return toast.error("Billing address is required", { containerId: "subscription" }), false;
  //       if (!formData.city.trim()) return toast.error("City is required", { containerId: "subscription" }), false;
  //       if (!formData.state.trim()) return toast.error("State is required", { containerId: "subscription" }), false;
  //       if (!formData.zip.trim()) return toast.error("ZIP code is required", { containerId: "subscription" }), false;
  //       return true;

  //     default:
  //       return true;
  //   }
  // };

  const validateStep = (step) => {
  if (step === 2) {
    if (!formData.firstName.trim()) {
      toast.error("First name is required", { containerId: "subscription" });
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required", { containerId: "subscription" });
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email address is required", { containerId: "subscription" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Invalid email format", { containerId: "subscription" });
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Mobile number is required", { containerId: "subscription" });
      return false;
    }
    return true;
  }

  if (step === 3) {
    if (!formData.billingAddress.trim()) {
      toast.error("Billing address is required", { containerId: "subscription" });
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("City is required", { containerId: "subscription" });
      return false;
    }
    if (!formData.state.trim()) {
      toast.error("State is required", { containerId: "subscription" });
      return false;
    }
    if (!formData.zip.trim()) {
      toast.error("ZIP code is required", { containerId: "subscription" });
      return false;
    }
    return true;
  }

  return true;
};


  const handleProceed = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fetch plan + subscription info (only if token exists)
  useEffect(() => {
    const fetchPlanAndSub = async () => {
      try {
        if (!planId) {
          toast.error("Missing planId in URL", { containerId: "subscription" });
          return;
        }

        // 1) Plan (public)
        const planRes = await axios.get(`${BASE_URL}/get-plan/${planId}`);
        const rawPlan = planRes?.data?.singlePlan;
        if (!rawPlan) {
          toast.error("Plan not found", { containerId: "subscription" });
          return;
        }

        const processedPlan = {
          ...rawPlan,
          price: rawPlan.price?.$numberDecimal ? parseFloat(rawPlan.price.$numberDecimal) : rawPlan.price,
        };
        setPlan(processedPlan);

        // 2) Subscription info (requires auth) — ONLY call if token exists
        if (token) {
          const subRes = await axios.get(`${BASE_URL}/getSubscriptionInfo`, {
            headers: { authorization: `Bearer ${token}` },
          });
          setSubscriptionInfo(subRes?.data?.subscription || null);
        } else {
          setSubscriptionInfo(null);
        }
      } catch (error) {
        console.error("Error fetching plan/subscription:", error);
        toast.error(error?.response?.data?.error || "Unable to load subscription details", { containerId: "subscription" });
      }
    };

    fetchPlanAndSub();
  }, [planId, token]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ToastContainer containerId="subscription" position="top-right" autoClose={5000} />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer containerId="subscription" position="top-right" autoClose={5000} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 flex items-center space-x-4">
          <img
            src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
            alt="Logo"
            className="h-12 w-12"
          />
          <h1 className="text-2xl font-bold text-gray-900">E-Lex Signature</h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= stepNum ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`flex-1 h-1 ${currentStep > stepNum ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Order Summary</h3>

              <div className="border rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{plan.name}</h4>
                    <p className="text-sm text-gray-500">{plan.billingCycle}</p>
                  </div>
                  <span className="text-lg font-semibold">${Number(plan.price).toFixed(2)}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold text-blue-600">${Number(plan.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceed}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8">Account Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="company"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8">Billing Address</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <input
                    type="text"
                    name="billingAddress"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.billingAddress}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <select
                    name="country"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={formData.country}
                    onChange={handleInputChange}
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Senegal">Senegal</option>
                    <option value="The Gambia">The Gambia</option>
                    {/* keep your full list if you want */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
                  <input
                    type="text"
                    name="state"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code *</label>
                  <input
                    type="text"
                    name="zip"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.zip}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8">Payment Method</h3>

              <div className="space-y-4">
                <div
                  onClick={() => {
                    setPaymentMethod("card");
                    setCurrentStep(5);
                  }}
                  className="p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 3v2m-4 4h18M6 21h12a3 3 0 003-3V6a3 3 0 00-3-3H6a3 3 0 00-3 3v12a3 3 0 003 3z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Credit/Debit Card</h4>
                        <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-6">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && paymentMethod === "card" && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                amount={Number(plan.price)}
                onBack={handleBack}
                subscriptionInfo={subscriptionInfo}
                planId={planId}
                formData={formData}
              />
            </Elements>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              256-bit SSL Security
            </span>
            <span>PCI Compliant</span>
          </div>
          <p>Your payment information is securely encrypted</p>
        </div>
      </div>
    </div>
  );
};

const PaymentForm = ({ amount, onBack, subscriptionInfo, planId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      const next = encodeURIComponent(`/subscription?planId=${planId}`);
      navigate(`/join?mode=login&next=${next}`, { replace: true });
      return;
    }

    if (!stripe || !elements) {
      toast.error("Stripe is still loading. Please try again.", { containerId: "subscription" });
      return;
    }

    setLoading(true);

    try {
      const card = elements.getElement(CardElement);
      if (!card) {
        toast.error("Card form not ready yet.", { containerId: "subscription" });
        setLoading(false);
        return;
      }

      const { error: pmErr, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (pmErr) {
        toast.error(pmErr.message || "Payment method error", { containerId: "subscription" });
        setLoading(false);
        return;
      }

      // ✅ Use lowercase "authorization" consistently
      const headers = { headers: { authorization: `Bearer ${token}` } };

      if (subscriptionInfo?._id) {
        await axios.patch(
          `${BASE_URL}/updateSubscription`,
          {
            newPlanId: planId,
            paymentMethodId: paymentMethod.id,
            subscriptionId: subscriptionInfo._id,
          },
          headers
        );
      } else {
        await axios.post(
          `${BASE_URL}/createSubscription`,
          {
            planId,
            paymentMethodId: paymentMethod.id,
          },
          headers
        );
      }

      toast.success("Subscription updated!", { containerId: "subscription" });
      navigate("/admin", { replace: true });
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err?.response?.data?.error || err.message || "Payment failed. Please try again.", {
        containerId: "subscription",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-gray-900 mb-8">Payment Details</h3>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  "::placeholder": { color: "#9ca3af" },
                },
                invalid: { color: "#dc2626" },
              },
              hidePostalCode: true,
            }}
          />
        </div>

        <div className="flex justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              `Pay $${Number(amount).toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SubscriptionFlow;
