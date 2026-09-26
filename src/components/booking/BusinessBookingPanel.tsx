"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  X,
} from "lucide-react";
import { rememberBookingId } from "@/lib/customerBookingIds";

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    price: 499,
    features: [
      "Standard Inspection",
      "Minor Repairs Included",
      "30-Day Warranty",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 899,
    features: [
      "Deep Servicing",
      "Component Cleaning",
      "60-Day Warranty",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 1499,
    features: [
      "Priority Support",
      "Spare Parts Included*",
      "90-Day Warranty",
      "Final Inspection Report",
    ],
  },
];

type Props = {
  businessId: string;
  businessName: string;
  services: string[];
};

export function BusinessBookingPanel({
  businessId,
  businessName,
  services,
}: Props) {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);

  // Selection State
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]);
  const [service] = useState(services[0] ?? "General Service");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[2]);

  // Contact State
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // System State
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const minDate = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestBooking: true,
          businessId,
          businessName,
          service: `${service} (${
            selectedPackage?.name ?? "Standard"
          } Package)`,
          date,
          timeSlot,
          userName,
          userPhone,
          address,
          landmark,
          specialInstructions,
          amount: selectedPackage?.price ?? 0,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };

      if (!res.ok) {
        setErr(data.error ?? "Booking failed");
        setLoading(false);
        return;
      }

      if (data.id) {
        rememberBookingId(data.id);
        setDone(data.id);
      }
    } catch {
      setErr("Network error");
    }

    setLoading(false);
  };

  const nextStep = () => {
    if (step === 2 && !date) return;

    if (step === 3 && (!userName || !userPhone || !address)) return;

    setStep(step + 1);
  };

  if (done) {
    return (
      <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 text-center animate-in zoom-in duration-500 shadow-xl shadow-gray-200/50">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
          <CheckCircle2 size={40} />
        </div>

        <h3 className="text-2xl font-black text-navy uppercase tracking-tight">
          Booking Confirmed!
        </h3>

        <p className="mt-2 text-gray-500 font-medium leading-relaxed">
          Your professional is scheduled to arrive on{" "}
          <span className="text-navy font-bold">
            {date} at {timeSlot}
          </span>
          .
        </p>

        <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-4 text-xs font-bold text-navy uppercase tracking-[0.2em]">
          Booking ID: {done}
        </div>

        <button
          onClick={() => (window.location.href = `/search`)}
          className="mt-8 w-full rounded-2xl bg-navy py-4 text-sm font-bold text-white shadow-xl shadow-navy/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          Return to Search
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-emerald-500" size={20} />

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a2d5c]">
              Premium Guaranteed Service
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Background-verified professionals. Follows strict safety
            protocols and transparent pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl bg-[#FF9933] py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
        >
          Book Professional
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/60 backdrop-blur-md sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[3rem] bg-[#FDFCFB] shadow-2xl sm:rounded-[3rem] animate-in slide-in-from-bottom duration-500 h-[90vh] sm:h-auto flex flex-col">

        {/* Header */}
        <div className="relative border-b border-gray-100 bg-white p-6 shrink-0">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else setOpen(false);
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors"
          >
            {step > 1 ? <ChevronLeft size={24} /> : <X size={24} />}
          </button>

          <h2 className="text-center text-xs font-black text-navy uppercase tracking-[0.3em]">
            STEP {step} / 4
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={submit} className="space-y-8">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-4">
                  <h3 className="text-3xl font-black text-navy">
                    Select Detail
                  </h3>

                  <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Premium cleaning & repair packages
                  </p>
                </div>

                <div className="space-y-4">
                  {PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full relative overflow-hidden rounded-[2.5rem] border-2 p-6 text-left transition-all duration-300 ${
                        selectedPackage.id === pkg.id
                          ? "border-navy bg-navy/5 shadow-xl shadow-gray-200/50"
                          : "border-gray-50 bg-white hover:border-gray-100"
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute top-0 right-10 rounded-b-xl bg-[#FF9933] px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-white shadow-sm">
                          POPULAR
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-black text-navy uppercase tracking-tight">
                          {pkg.name}
                        </span>

                        <span className="text-xl font-black text-navy">
                          ₹{pkg.price}
                        </span>
                      </div>

                      <ul className="space-y-2">
                        {pkg.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                          >
                            <CheckCircle
                              size={12}
                              className="text-india-green"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-4">
                  <h3 className="text-3xl font-black text-navy">
                    Set Schedule
                  </h3>

                  <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    When should we arrive?
                  </p>
                </div>

                <div className="space-y-8">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">
                      Preferred Date
                    </span>

                    <input
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-3 w-full rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm font-bold shadow-sm focus:border-navy outline-none"
                      required
                    />
                  </label>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">
                      Available Slots
                    </span>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTimeSlot(t)}
                          className={`rounded-[1.5rem] border py-4 text-[10px] font-black transition-all duration-300 ${
                            timeSlot === t
                              ? "border-navy bg-navy text-white shadow-lg scale-105"
                              : "border-gray-50 bg-white text-gray-400 hover:border-gray-200 hover:text-navy"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-4">
                  <h3 className="text-3xl font-black text-navy">
                    Address
                  </h3>

                  <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Where should the pro deliver?
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    placeholder="FULL NAME"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-white px-6 py-5 text-xs font-bold shadow-sm outline-none focus:border-navy uppercase tracking-widest"
                    required
                  />

                  <input
                    placeholder="PHONE NUMBER"
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-white px-6 py-5 text-xs font-bold shadow-sm outline-none focus:border-navy uppercase tracking-widest"
                    required
                  />

                  <textarea
                    placeholder="COMPLETE ADDRESS (HOUSE NO, STREET...)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-32 w-full rounded-[2rem] border border-gray-100 bg-white px-6 py-5 text-xs font-bold shadow-sm outline-none focus:border-navy uppercase tracking-widest leading-relaxed"
                    required
                  />

                  <input
                    placeholder="LANDMARK (OPTIONAL)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-white px-6 py-5 text-xs font-bold shadow-sm outline-none focus:border-navy uppercase tracking-widest"
                  />

                  {/* SPECIAL INSTRUCTIONS */}
                  <div className="space-y-2">
                    <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Special Instructions (Optional)
                    </label>

                    <textarea
                      placeholder="E.g. Please call before arriving, bring shoe covers, or use the side entrance..."
                      value={specialInstructions}
                      onChange={(e) =>
                        setSpecialInstructions(e.target.value)
                      }
                      maxLength={300}
                      className="h-28 w-full rounded-[2rem] border border-gray-100 bg-white px-6 py-5 text-xs font-medium shadow-sm outline-none focus:border-navy leading-relaxed resize-none"
                    />

                    <div className="flex justify-end pr-2 text-[9px] font-bold text-gray-400">
                      {specialInstructions.length}/300
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-4">
                  <h3 className="text-3xl font-black text-navy">
                    Review & Pay
                  </h3>

                  <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Confirm your premium booking
                  </p>
                </div>

                <div className="rounded-[2.5rem] bg-navy p-10 text-white shadow-2xl shadow-navy/30">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Category
                    </span>

                    <span className="text-xs font-black uppercase tracking-wider">
                      {service}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Package
                    </span>

                    <span className="text-xs font-black uppercase tracking-wider">
                      {selectedPackage.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Schedule
                    </span>

                    <span className="text-xs font-black uppercase tracking-wider">
                      {date} • {timeSlot}
                    </span>
                  </div>

                  <div className="h-px w-full bg-white/10 mb-8" />

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Total
                    </span>

                    <span className="text-3xl font-black">
                      ₹{selectedPackage?.price ?? 0}
                    </span>
                  </div>
                </div>

                {/* SPECIAL INSTRUCTIONS SUMMARY */}
                {specialInstructions && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                      Special Instructions
                    </p>

                    <p className="text-xs font-medium text-navy leading-relaxed">
                      {specialInstructions}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">
                    Payment Mode
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-2xl border-2 border-navy bg-navy/5 p-5 text-left"
                    >
                      <div className="h-4 w-4 rounded-full border-4 border-navy bg-white" />

                      <span className="text-[10px] font-black uppercase tracking-widest text-navy">
                        UPI / GPAY
                      </span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left opacity-50"
                    >
                      <div className="h-4 w-4 rounded-full border border-gray-400" />

                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        CASH (POST)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {err && (
              <p className="mt-4 text-center text-xs font-bold text-red-500">
                {err}
              </p>
            )}
          </form>
        </div>

        {/* Action Bar */}
        <div className="shrink-0 bg-white p-8 border-t border-gray-100">
          <button
            type="button"
            disabled={loading}
            onClick={step < 4 ? nextStep : () => void submit()}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-[2rem] bg-navy text-xs font-black uppercase tracking-[0.3em] text-white shadow-xl shadow-navy/30 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                {step === 4 ? "Complete Payment" : "Continue"}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}