"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Edit3,
  Home,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  User,
  X,
  XCircle,
} from "lucide-react";
import { getStoredBookingIds } from "@/lib/customerBookingIds";
import type { Booking } from "@/lib/types";

type SavedAddress = {
  id: string;
  label: string;
  address: string;
};

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Booking placed",
    description: "Your booking request has been received.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "The service provider has confirmed your booking.",
  },
  {
    key: "completed",
    label: "Completed",
    description: "The service has been completed.",
  },
];

export default function MyBookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressText, setAddressText] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const ids = getStoredBookingIds();

      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const res = await fetch("/api/bookings/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error("Failed to load bookings");
      }

      const data = (await res.json()) as {
        bookings: Booking[];
      };

      setRows(
        data.bookings.sort((a, b) =>
          (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
        )
      );
    } catch {
      setError("Unable to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    try {
      const savedProfile = localStorage.getItem("seva-sansaar-profile");

      if (savedProfile) {
        const profile = JSON.parse(savedProfile) as {
          name?: string;
          email?: string;
          phone?: string;
        };

        setProfileName(profile.name ?? "");
        setProfileEmail(profile.email ?? "");
        setProfilePhone(profile.phone ?? "");
      }

      const saved = localStorage.getItem("seva-sansaar-addresses");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setSavedAddresses(parsed as SavedAddress[]);
        }
      }
    } catch {
      // Ignore invalid local storage data.
    }
  }, [load]);

  const upcoming = useMemo(
    () =>
      rows.filter(
        (booking) =>
          booking.status === "pending" ||
          booking.status === "confirmed"
      ),
    [rows]
  );

  const completed = useMemo(
    () => rows.filter((booking) => booking.status === "completed"),
    [rows]
  );

  const cancelled = useMemo(
    () => rows.filter((booking) => booking.status === "cancelled"),
    [rows]
  );

  const saveProfile = () => {
    const profile = {
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    };

    localStorage.setItem(
      "seva-sansaar-profile",
      JSON.stringify(profile)
    );

    setEditingProfile(false);
  };

  const saveAddresses = (addresses: SavedAddress[]) => {
    setSavedAddresses(addresses);

    localStorage.setItem(
      "seva-sansaar-addresses",
      JSON.stringify(addresses)
    );
  };

  const addAddress = () => {
    if (!addressText.trim()) {
      alert("Please enter an address.");
      return;
    }

    const newAddress: SavedAddress = {
      id: `${Date.now()}`,
      label: addressLabel.trim() || "Home",
      address: addressText.trim(),
    };

    saveAddresses([...savedAddresses, newAddress]);

    setAddressLabel("");
    setAddressText("");
    setShowAddressForm(false);
  };

  const deleteAddress = (id: string) => {
    saveAddresses(
      savedAddresses.filter((address) => address.id !== id)
    );
  };

  const cancel = async (id: string) => {
    if (!phone.trim()) {
      alert("Enter the phone number used for the booking to cancel.");
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
          guestPhone: phone,
        }),
      });

      if (!res.ok) {
        alert(
          "Could not cancel. Check the phone number used for the booking."
        );
        return;
      }

      setPhone("");
      setCancelFor(null);
      await load();
    } catch {
      alert("Something went wrong while cancelling the booking.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm font-semibold text-gray-600 shadow-sm">
          <Loader2 className="animate-spin" size={20} />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1a2d5c]">
            Customer Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
            My Bookings
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Track and manage your service bookings, profile and saved
            addresses in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a2d5c] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#142247]"
          >
            <User size={16} />
            My Profile
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Upcoming"
          count={upcoming.length}
          icon={<Clock3 size={20} />}
          description="Pending & confirmed"
        />

        <SummaryCard
          title="Completed"
          count={completed.length}
          icon={<CheckCircle2 size={20} />}
          description="Finished services"
        />

        <SummaryCard
          title="Cancelled"
          count={cancelled.length}
          icon={<XCircle size={20} />}
          description="Cancelled bookings"
        />
      </div>

      {/* SAVED ADDRESSES */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
              <Home size={21} />
            </div>

            <div>
              <h2 className="font-black text-gray-900">
                Saved Addresses
              </h2>

              <p className="text-sm text-gray-500">
                Manage addresses for faster future bookings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddressForm((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a2d5c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#142247]"
          >
            <Plus size={16} />
            Add Address
          </button>
        </div>

        {showAddressForm && (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                value={addressLabel}
                onChange={(event) =>
                  setAddressLabel(event.target.value)
                }
                placeholder="Label e.g. Home"
                className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1a2d5c]"
              />

              <input
                type="text"
                value={addressText}
                onChange={(event) =>
                  setAddressText(event.target.value)
                }
                placeholder="Enter your address"
                className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1a2d5c] sm:col-span-2"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addAddress}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Save size={14} />
                Save Address
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false);
                  setAddressLabel("");
                  setAddressText("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {savedAddresses.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <MapPin
              size={28}
              className="mx-auto text-gray-300"
            />

            <p className="mt-2 text-sm font-semibold text-gray-500">
              No saved addresses yet.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-4"
              >
                <div className="flex min-w-0 gap-3">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-[#1a2d5c]"
                  />

                  <div className="min-w-0">
                    <p className="font-black text-gray-900">
                      {address.label}
                    </p>

                    <p className="mt-1 break-words text-sm text-gray-500">
                      {address.address}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteAddress(address.id)}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${address.label}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BOOKINGS */}
      <BookingSection
        title="Upcoming"
        description="Pending and confirmed bookings"
        icon={<Clock3 size={20} />}
        bookings={upcoming}
        emptyText="No upcoming bookings."
        cancelFor={cancelFor}
        phone={phone}
        expandedBooking={expandedBooking}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        setExpandedBooking={setExpandedBooking}
        onCancel={cancel}
      />

      <BookingSection
        title="Completed"
        description="Services that have been completed"
        icon={<CheckCircle2 size={20} />}
        bookings={completed}
        emptyText="No completed bookings yet."
        cancelFor={cancelFor}
        phone={phone}
        expandedBooking={expandedBooking}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        setExpandedBooking={setExpandedBooking}
        onCancel={cancel}
      />

      <BookingSection
        title="Cancelled"
        description="Previously cancelled bookings"
        icon={<XCircle size={20} />}
        bookings={cancelled}
        emptyText="No cancelled bookings."
        cancelFor={cancelFor}
        phone={phone}
        expandedBooking={expandedBooking}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        setExpandedBooking={setExpandedBooking}
        onCancel={cancel}
      />

      {/* PROFILE MODAL */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#1a2d5c]">
                  Account
                </p>

                <h2 className="mt-1 text-xl font-black text-gray-900">
                  My Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close profile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {!editingProfile ? (
                <>
                  <ProfileRow
                    icon={<User size={17} />}
                    label="Name"
                    value={profileName || "Not added"}
                  />

                  <ProfileRow
                    icon={<Phone size={17} />}
                    label="Phone"
                    value={profilePhone || "Not added"}
                  />

                  <ProfileRow
                    icon={<MapPin size={17} />}
                    label="Email"
                    value={profileEmail || "Not added"}
                  />

                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2d5c] px-4 py-3 text-sm font-bold text-white hover:bg-[#142247]"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <ProfileInput
                    label="Full Name"
                    value={profileName}
                    onChange={setProfileName}
                    placeholder="Enter your name"
                  />

                  <ProfileInput
                    label="Email"
                    value={profileEmail}
                    onChange={setProfileEmail}
                    placeholder="Enter your email"
                    type="email"
                  />

                  <ProfileInput
                    label="Phone"
                    value={profilePhone}
                    onChange={setProfilePhone}
                    placeholder="Enter your phone number"
                    type="tel"
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={saveProfile}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  count,
  icon,
  description,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
          {icon}
        </div>

        <span className="text-3xl font-black text-gray-900">
          {count}
        </span>
      </div>

      <h2 className="mt-4 font-black text-gray-900">{title}</h2>

      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function BookingSection({
  title,
  description,
  icon,
  bookings,
  emptyText,
  cancelFor,
  phone,
  expandedBooking,
  setPhone,
  setCancelFor,
  setExpandedBooking,
  onCancel,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  bookings: Booking[];
  emptyText: string;
  cancelFor: string | null;
  phone: string;
  expandedBooking: string | null;
  setPhone: (value: string) => void;
  setCancelFor: (value: string | null) => void;
  setExpandedBooking: (value: string | null) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900">
            {title}
          </h2>

          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <CalendarCheck
            size={32}
            className="mx-auto text-gray-300"
          />

          <p className="mt-3 text-sm font-semibold text-gray-500">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              cancelFor={cancelFor}
              phone={phone}
              expandedBooking={expandedBooking}
              setPhone={setPhone}
              setCancelFor={setCancelFor}
              setExpandedBooking={setExpandedBooking}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingCard({
  booking,
  cancelFor,
  phone,
  expandedBooking,
  setPhone,
  setCancelFor,
  setExpandedBooking,
  onCancel,
}: {
  booking: Booking;
  cancelFor: string | null;
  phone: string;
  expandedBooking: string | null;
  setPhone: (value: string) => void;
  setCancelFor: (value: string | null) => void;
  setExpandedBooking: (value: string | null) => void;
  onCancel: (id: string) => void;
}) {
  const statusClasses: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const canCancel =
    booking.status === "pending" ||
    booking.status === "confirmed";

  const isExpanded =
    booking.id !== undefined &&
    expandedBooking === booking.id;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-black text-gray-900">
                {booking.businessName}
              </h3>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${
                  statusClasses[booking.status] ??
                  "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-gray-600">
              {booking.service}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarCheck size={14} />
                {booking.date}
              </span>

              <span className="inline-flex items-center gap-1">
                <Clock3 size={14} />
                {booking.timeSlot}
              </span>

              {booking.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {booking.address}
                </span>
              )}
            </div>

            {booking.notes && (
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <strong>Notes:</strong> {booking.notes}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {booking.id && (
              <button
                type="button"
                onClick={() => {
                  if (!booking.id) return;

                  setExpandedBooking(
                    isExpanded ? null : booking.id
                  );
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#1a2d5c]/20 bg-[#1a2d5c]/5 px-3 py-2 text-xs font-bold text-[#1a2d5c] hover:bg-[#1a2d5c]/10"
              >
                <CalendarCheck size={14} />
                {isExpanded ? "Hide details" : "View details"}
              </button>
            )}

            {booking.userPhone && (
              <a
                href={`tel:${booking.userPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                <Phone size={14} />
                Support
              </a>
            )}

            {canCancel &&
              (cancelFor === booking.id ? (
                <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                  <input
                    type="tel"
                    placeholder="Phone on booking"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#1a2d5c] sm:w-40"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (booking.id) {
                        onCancel(booking.id);
                      }
                    }}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Confirm cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelFor(null);
                      setPhone("");
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-600"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (booking.id) {
                      setCancelFor(booking.id);
                      setPhone("");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              ))}

            <button
              type="button"
              onClick={() =>
                alert(
                  "Rebook: open the business page and book again."
                )
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={14} />
              Rebook
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED BOOKING VIEW */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h4 className="font-black text-gray-900">
                Booking details
              </h4>

              <div className="mt-4 space-y-3">
                <DetailRow
                  label="Service"
                  value={booking.service}
                />

                <DetailRow
                  label="Business"
                  value={booking.businessName}
                />

                <DetailRow
                  label="Date"
                  value={booking.date}
                />

                <DetailRow
                  label="Time"
                  value={booking.timeSlot}
                />

                <DetailRow
                  label="Address"
                  value={booking.address || "Not provided"}
                />

                {booking.notes && (
                  <DetailRow
                    label="Notes"
                    value={booking.notes}
                  />
                )}
              </div>
            </div>

            <StatusTracker status={booking.status} />
          </div>
        </div>
      )}
    </article>
  );
}

function StatusTracker({
  status,
}: {
  status: Booking["status"];
}) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle size={20} />
          </div>

          <div>
            <h4 className="font-black text-red-800">
              Booking cancelled
            </h4>

            <p className="text-sm text-red-700">
              This booking is no longer active.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex =
    status === "pending"
      ? 0
      : status === "confirmed"
        ? 1
        : 2;

  return (
    <div>
      <h4 className="font-black text-gray-900">
        Booking status
      </h4>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="space-y-5">
          {STATUS_STEPS.map((step, index) => {
            const completed = index <= currentIndex;
            const active = index === currentIndex;

            return (
              <div
                key={step.key}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      completed
                        ? "bg-[#1a2d5c] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Clock3 size={18} />
                    )}
                  </div>

                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`mt-1 h-8 w-0.5 ${
                        index < currentIndex
                          ? "bg-[#1a2d5c]"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>

                <div className="pt-1">
                  <p
                    className={`text-sm font-black ${
                      active
                        ? "text-[#1a2d5c]"
                        : completed
                          ? "text-gray-800"
                          : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-700">
        {value}
      </p>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-[#1a2d5c]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-400">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a2d5c] focus:ring-2 focus:ring-[#1a2d5c]/10"
      />
    </label>
  );
}