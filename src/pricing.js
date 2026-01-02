// src/pricing.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "./baseUrl";
import { useNavigate, Link } from "react-router-dom";

// --- Yearly discount if you DO NOT have yearly plans in DB ---
const DEFAULT_YEARLY_DISCOUNT = 0.2; // 20% off yearly

// --- Which plan to highlight as “Most Popular” ---
const RECOMMENDED_PLAN_NAME = "standard"; // case-insensitive match: "standard"

const fmtMoney = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return `$${num.toFixed(num % 1 === 0 ? 0 : 2)}`;
};

// Handles Decimal128 shapes and strings
const toNumber = (v) => {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const p = parseFloat(v);
    return Number.isFinite(p) ? p : null;
  }
  if (typeof v === "object" && v.$numberDecimal) {
    const p = parseFloat(v.$numberDecimal);
    return Number.isFinite(p) ? p : null;
  }
  return null;
};

const planImg = (key) => {
  // Replace with your own images later if you want
  const map = {
    personal: "https://app.opensignlabs.com/static/media/free.acf92ef73b7180fe7202.png",
    standard: "https://app.opensignlabs.com/static/media/teams.2fee804949169a9b5e08.png",
    business: "https://app.opensignlabs.com/static/media/enterprise.b82600eced022809e1c4.png",
  };
  return map[key] || "https://via.placeholder.com/120x120?text=E-Lex";
};

const normalizeNameKey = (name = "") => {
  const n = String(name || "").trim().toLowerCase();
  if (n.includes("personal") || n.includes("starter") || n.includes("free")) return "personal";
  if (n.includes("standard") || n.includes("pro") || n.includes("team")) return "standard";
  if (n.includes("business") || n.includes("enterprise")) return "business";
  return n.replace(/\s+/g, "-");
};

export default function Pricing() {
  const navigate = useNavigate();

  const [billing, setBilling] = useState("monthly"); // "monthly" | "yearly"
  const [discountRate, setDiscountRate] = useState(DEFAULT_YEARLY_DISCOUNT);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [subLoading, setSubLoading] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [currentPlanName, setCurrentPlanName] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null); // active/canceled/etc
  const [renewalDate, setRenewalDate] = useState(null);

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const isLoggedIn = !!token;

  // keep token in sync when login/logout happens in another tab or route
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);

    // also update token on focus (covers same-tab login redirect)
    const onFocus = () => setToken(localStorage.getItem("token"));
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);


  // -----------------------------
  // Fetch Plans (public endpoint; don't require auth)
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const res = await axios.get(`${BASE_URL}/get-plans`, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        });
        const rawPlans = res?.data?.plans || [];
        const cleaned = rawPlans.map((p) => ({
          ...p,
          price: toNumber(p.price),
          billingCycle: (p.billingCycle || "monthly").toLowerCase(),
        }));
        if (mounted) setPlans(cleaned);
      } catch (e) {
        toast.error("Failed to load plans", { containerId: "pricing" });
      } finally {
        if (mounted) setLoadingPlans(false);
      }
    };

    fetchPlans();
    return () => {
      mounted = false;
    };
  }, [token]);

  // -----------------------------
  // Fetch Subscription (only when logged in)
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    const fetchSubscription = async () => {
      if (!token) {
        if (mounted) setSubLoading(false);
        return;
      }
      try {
        setSubLoading(true);
        const res = await axios.get(`${BASE_URL}/getSubscriptionInfo`, {
          headers: { authorization: `Bearer ${token}` },
        });

        // Handle multiple possible shapes safely
        const data = res?.data || {};
        const sub =
          data.subscription ||
          data.sub ||
          data.subscriptionInfo ||
          data.subscriptionData ||
          null;

        const plan =
          data.plan ||
          data.currentPlan ||
          data.planInfo ||
          sub?.plan ||
          null;

        const planId = plan?._id || sub?.plan?._id || sub?.planId || sub?.plan_id || null;
        const planName = plan?.name || sub?.plan?.name || null;
        const status = sub?.status || data.status || null;

        const renew =
          sub?.currentPeriodEnd ||
          sub?.current_period_end ||
          sub?.renewalDate ||
          sub?.nextBillingDate ||
          null;

        if (!mounted) return;
        setCurrentPlanId(planId);
        setCurrentPlanName(planName);
        setCurrentStatus(status);
        setRenewalDate(renew);
      } catch (e) {
        // Don’t toast here; pricing should still work if subscription fetch fails
      } finally {
        if (mounted) setSubLoading(false);
      }
    };

    fetchSubscription();
    return () => {
      mounted = false;
    };
  }, [token]);

  // -----------------------------
  // Derived: monthly plans + yearly plans
  // -----------------------------
  const monthlyPlans = useMemo(
    () => plans.filter((p) => p.billingCycle === "monthly"),
    [plans]
  );

  const yearlyPlansFromDB = useMemo(
    () => plans.filter((p) => p.billingCycle === "yearly"),
    [plans]
  );

  // If you don’t have yearly plans in DB, compute yearly from monthly
  const computedYearlyPlans = useMemo(() => {
    return monthlyPlans.map((p) => {
      const monthlyPrice = toNumber(p.price) ?? 0;
      const yearlyRaw = monthlyPrice * 12;
      const yearlyDiscounted = yearlyRaw * (1 - discountRate);
      return {
        ...p,
        _computedYearly: true,
        billingCycle: "yearly",
        monthlyEquivalent: yearlyDiscounted / 12,
        price: yearlyDiscounted,
        yearlyOriginal: yearlyRaw,
      };
    });
  }, [monthlyPlans, discountRate]);

  const displayPlans = useMemo(() => {
    if (billing === "monthly") return monthlyPlans;

    // Prefer real yearly plans if present
    if (yearlyPlansFromDB.length > 0) return yearlyPlansFromDB;

    // Otherwise compute
    return computedYearlyPlans;
  }, [billing, monthlyPlans, yearlyPlansFromDB, computedYearlyPlans]);

  // Sort plans in a nice order (personal, standard, business)
  const orderedPlans = useMemo(() => {
    const rank = (p) => {
      const key = normalizeNameKey(p.name);
      if (key === "personal") return 1;
      if (key === "standard") return 2;
      if (key === "business") return 3;
      return 99;
    };
    return [...displayPlans].sort((a, b) => rank(a) - rank(b));
  }, [displayPlans]);

  const handleChoose = (planId) => {
    // Best UX:
    // - If logged in -> go to subscription checkout
    // - If not logged in -> go to /join BUT preserve return URL so they don’t lose context
    const next = `/subscription?planId=${encodeURIComponent(planId)}`;

    if (!token) {
      localStorage.setItem("post_login_redirect", next);
      navigate(`/join?mode=login&next=${encodeURIComponent(next)}`);
      return;
    }

    navigate(next);
  };

  // Determine if a plan is the user’s current plan
  const isCurrentPlan = (plan) => {
    if (!currentPlanId) return false;
    return String(plan._id) === String(currentPlanId);
  };

  const isRecommended = (plan) => {
    const key = normalizeNameKey(plan.name);
    return key === RECOMMENDED_PLAN_NAME;
  };

  // A short tagline per plan (DocuSign-ish)
  const planTagline = (plan) => {
    const key = normalizeNameKey(plan.name);
    if (key === "personal") return "For individuals & freelancers";
    if (key === "standard") return "For growing teams";
    if (key === "business") return "For companies & departments";
    return "For secure e-sign workflows";
  };

  return (
    <div className="min-h-screen bg-[#eef1f6]">
      <ToastContainer containerId="pricing" />

      {/* TOP NAV (DocuSign-ish) */}
      <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
              alt="E-Lex Signature"
              className="h-8 w-8 -rotate-6"
            />
            <span className="text-xl font-bold text-slate-900">E-Lex Signature</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/" className="text-slate-600 hover:text-purple-600">
              Home
            </Link>
            <Link to="/pricing" className="text-slate-900 font-semibold">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link to="/join" className="text-slate-700 hover:text-purple-600 text-sm font-medium">
                  Log In
                </Link>
                <Link
                  to="/join?mode=signup"
                  className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-purple-700"
                >
                  Get started
                </Link>
              </>
            ) : (
              <>
                <Link to="/admin" className="text-slate-700 hover:text-purple-600 text-sm font-medium">
                  Dashboard
                </Link>
                <Link
                  to="/pricing"
                  className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-purple-700"
                >
                  Upgrade
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-6 pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
              Simple, transparent pricing
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Send and sign legally-binding documents with secure audit trails. Cancel anytime.
            </p>

            {/* Subscription summary */}
            {isLoggedIn && !subLoading && (
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm text-slate-600">Current plan:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {currentPlanName || "—"}
                </span>
                {currentStatus && (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {String(currentStatus).toLowerCase()}
                  </span>
                )}
                {renewalDate && (
                  <span className="text-sm text-slate-600">
                    • Renews:{" "}
                    <span className="font-medium text-slate-900">
                      {new Date(renewalDate).toLocaleDateString()}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm">
              <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  billing === "monthly" ? "bg-[#002864] text-white" : "text-slate-700 hover:text-slate-900"
                }`}
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  billing === "yearly" ? "bg-[#002864] text-white" : "text-slate-700 hover:text-slate-900"
                }`}
                onClick={() => setBilling("yearly")}
              >
                Yearly{" "}
                {yearlyPlansFromDB.length === 0 && (
                  <span className="ml-1 text-xs text-green-200 bg-green-700/80 px-2 py-0.5 rounded-full">
                    Save {Math.round(discountRate * 100)}%
                  </span>
                )}
              </button>
            </div>

            {/* Optional: discount slider only when computed yearly */}
            {billing === "yearly" && yearlyPlansFromDB.length === 0 && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-slate-600">Discount:</span>
                <select
                  className="text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                >
                  <option value={0.1}>10%</option>
                  <option value={0.15}>15%</option>
                  <option value={0.2}>20%</option>
                  <option value={0.25}>25%</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
          <div className="bg-white rounded-xl border border-slate-200 p-3">🔒 AES-256 at rest</div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">✅ ESIGN / UETA ready</div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">🧾 Audit trail included</div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">↩ Cancel anytime</div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-[1200px] mx-auto px-6 pb-14">
        {loadingPlans ? (
          <div className="text-center py-12 text-slate-600">Loading plans…</div>
        ) : orderedPlans.length === 0 ? (
          <div className="text-center py-12 text-slate-600">No plans available.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {orderedPlans.map((plan) => {
              const key = normalizeNameKey(plan.name);
              const recommended = isRecommended(plan);
              const current = isCurrentPlan(plan);

              const price = toNumber(plan.price) ?? 0;
              const per = billing === "monthly" ? "/mo" : "/yr";

              const monthlyEq =
                billing === "yearly" && plan._computedYearly
                  ? plan.monthlyEquivalent
                  : null;

              const originalYearly =
                billing === "yearly" && plan._computedYearly
                  ? plan.yearlyOriginal
                  : null;

              return (
                <div
                  key={plan._id}
                  className={`relative bg-white rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    recommended ? "border-purple-300 ring-2 ring-purple-200" : "border-slate-200"
                  }`}
                >
                  {recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                      Most Popular
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 uppercase">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{planTagline(plan)}</p>
                      </div>
                      <img
                        src={planImg(key)}
                        alt={plan.name}
                        className="h-12 w-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/48?text=E";
                        }}
                      />
                    </div>

                    {/* Price */}
                    <div className="mt-6">
                      <div className="flex items-end gap-2">
                        <div className="text-4xl font-extrabold text-slate-900">
                          {fmtMoney(price)}
                        </div>
                        <div className="text-slate-600 font-semibold">{per}</div>
                      </div>

                      {/* Yearly computed hints */}
                      {billing === "yearly" && plan._computedYearly && (
                        <div className="mt-2 text-sm text-slate-600">
                          <span className="font-medium text-slate-900">
                            {fmtMoney(monthlyEq)}
                          </span>{" "}
                          /mo equivalent
                          {Number.isFinite(originalYearly) && (
                            <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              Save {Math.round(discountRate * 100)}% (was {fmtMoney(originalYearly)}/yr)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Limits */}
                      <div className="mt-4 text-sm text-slate-600">
                        <div className="flex gap-3">
                          <span>
                            <span className="font-semibold text-slate-900">{plan.numberOfSigns}</span>{" "}
                            signatures
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>
                            <span className="font-semibold text-slate-900">{plan.numberOfEmails}</span>{" "}
                            emails
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      {current ? (
                        <button
                          type="button"
                          className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold cursor-not-allowed"
                          disabled
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChoose(plan._id)}
                          className={`w-full py-3 rounded-xl font-semibold text-white shadow-sm transition ${
                            recommended
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-[#002864] hover:bg-[#001a4a]"
                          }`}
                        >
                          {isLoggedIn ? "Upgrade / Choose Plan" : "Get started"}
                        </button>
                      )}

                      {!isLoggedIn && (
                        <p className="mt-2 text-xs text-slate-500">
                          You’ll be asked to log in before checkout.
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                        Includes
                      </div>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex gap-2">
                          <span className="text-green-600">✓</span> Audit trail & certificate
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-600">✓</span> Templates & re-use
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-600">✓</span> Email reminders
                        </li>
                        <li className="flex gap-2">
                          <span className="text-green-600">✓</span> 24/7 Support
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 text-center text-sm text-slate-600">
          Need a custom plan for your institution or bank workflows?{" "}
          <Link to="/contact" className="text-purple-700 font-semibold hover:underline">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
