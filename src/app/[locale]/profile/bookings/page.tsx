"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  XCircle,
  Eye,
  User,
  Plus,
  Save,
  RefreshCw,
} from "lucide-react";
import { getStoredBookingIds } from "@/lib/customerBookingIds";
import type { Booking } from "@/lib/types";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Booking Placed",
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
    description: "The service has been completed successfully.",
  },
] as const;

export default function MyBookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [detailsFor, setDetailsFor] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [showProfile, setShowProfile] = useState(false);

  const [addresses, setAddresses] = useState<string[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(
        "seva-sansaar-profile"
      );

      const savedAddresses = localStorage.getItem(
        "seva-sansaar-addresses"
      );

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile) as {
          name?: string;
          phone?: string;
          email?: string;
        };

        setProfile({
          name: parsedProfile.name ?? "",
          phone: parsedProfile.phone ?? "",
          email: parsedProfile.email ?? "",
        });
      }

      if (savedAddresses) {
        const parsedAddresses = JSON.parse(savedAddresses);

        if (Array.isArray(parsedAddresses)) {
          setAddresses(
            parsedAddresses.filter(
              (address): address is string =>
                typeof address === "string"
            )
          );
        }
      }
    } catch {
      // Ignore invalid local storage data.
    }
  }, []);

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
        [...data.bookings].sort((a, b) =>
          (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
        )
      );
    } catch {
      setError(
        "Unable to load your bookings. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
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
    localStorage.setItem(
      "seva-sansaar-profile",
      JSON.stringify(profile)
    );

    setShowProfile(false);
  };

  const saveAddress = () => {
    const trimmedAddress = newAddress.trim();

    if (!trimmedAddress) {
      alert("Please enter an address.");
      return;
    }

    const updated = [...addresses, trimmedAddress];

    setAddresses(updated);

    localStorage.setItem(
      "seva-sansaar-addresses",
      JSON.stringify(updated)
    );

    setNewAddress("");
    setShowAddressForm(false);
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

  /* ---------------- LOADING STATE ---------------- */

  if (loading) {
    return (
      <div className="min-h-[400px] w-full px-2 py-6 sm:px-0">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="animate-pulse">
            <div className="h-3 w-40 rounded bg-gray-200" />
            <div className="mt-3 h-9 w-52 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-full max-w-xl rounded bg-gray-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
                <div className="mt-4 h-4 w-24 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <Loader2
                className="animate-spin"
                size={20}
              />
              Loading your dashboard…
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-8 overflow-x-hidden pb-10">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1a2d5c]">
            Customer Dashboard
          </p>

          <h1 className="mt-2 break-words text-2xl font-black text-gray-900 sm:text-3xl">
            My Bookings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Track and manage your service bookings, profile and saved
            addresses in one place.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2d5c] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
          >
            <User size={16} />
            My Profile
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-red-700">
                Something went wrong
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 sm:w-auto"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3">
        <SummaryCard
          title="Upcoming"
          subtitle="Pending & confirmed"
          count={upcoming.length}
          icon={<Clock3 size={20} />}
        />

        <SummaryCard
          title="Completed"
          subtitle="Finished services"
          count={completed.length}
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          title="Cancelled"
          subtitle="Cancelled bookings"
          count={cancelled.length}
          icon={<XCircle size={20} />}
        />
      </div>

      {/* PROFILE */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-gray-900">
              My Profile
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your account information.
            </p>
          </div>

          <User
            size={22}
            className="hidden text-[#1a2d5c] min-[480px]:block"
          />
        </div>

        {showProfile ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  name: e.target.value,
                })
              }
              placeholder="Full Name"
              className="min-w-0 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a2d5c]"
            />

            <input
              value={profile.phone}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  phone: e.target.value,
                })
              }
              placeholder="Phone"
              type="tel"
              className="min-w-0 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a2d5c]"
            />

            <input
              value={profile.email}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  email: e.target.value,
                })
              }
              placeholder="Email"
              type="email"
              className="min-w-0 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a2d5c]"
            />

            <button
              type="button"
              onClick={saveProfile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2d5c] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
            >
              <Save size={16} />
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileItem
              label="Name"
              value={profile.name || "Not added"}
            />

            <ProfileItem
              label="Phone"
              value={profile.phone || "Not added"}
            />

            <ProfileItem
              label="Email"
              value={profile.email || "Not added"}
            />
          </div>
        )}
      </section>

      {/* SAVED ADDRESSES */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-gray-900">
              Saved Addresses
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage addresses for faster future bookings.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddressForm((value) => !value)
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2d5c] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
          >
            <Plus size={16} />
            Add Address
          </button>
        </div>

        {showAddressForm && (
          <div className="mb-5 flex flex-col gap-3">
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Enter your address"
              className="min-w-0 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a2d5c]"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={saveAddress}
                className="w-full rounded-xl bg-[#1a2d5c] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
              >
                Save Address
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(false);
                  setNewAddress("");
                }}
                className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
            No saved addresses yet.
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address, index) => (
              <div
                key={`${address}-${index}`}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-200 p-4"
              >
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-[#1a2d5c]"
                />

                <span className="min-w-0 break-words text-sm font-semibold leading-6 text-gray-700">
                  {address}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UPCOMING BOOKINGS */}
      <BookingSection
        title="Upcoming"
        description="Pending and confirmed bookings"
        icon={<Clock3 size={20} />}
        bookings={upcoming}
        emptyText="No upcoming bookings."
        cancelFor={cancelFor}
        detailsFor={detailsFor}
        phone={phone}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        setDetailsFor={setDetailsFor}
        onCancel={cancel}
      />

      {/* COMPLETED BOOKINGS */}
      <BookingSection
        title="Completed"
        description="Services that have been completed"
        icon={<CheckCircle2 size={20} />}
        bookings={completed}
        emptyText="No completed bookings yet."
        cancelFor={cancelFor}
        detailsFor={detailsFor}
        phone={phone}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        setDetailsFor={setDetailsFor}
        onCancel={cancel}
      />

      {/* CANCELLED BOOKINGS */}
      <BookingSection
        title="Cancelled"
        description="Previously cancelled bookings"
        icon={<XCircle size={20} />}
        bookings={cancelled}
        emptyText="No cancelled bookings."
        cancelFor={cancelFor}
        detailsFor={detailsFor}
        phone={phone}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        setDetailsFor={setDetailsFor}
        onCancel={cancel}
      />
    </div>
  );
}

function SummaryCard({
  title,
  subtitle,
  count,
  icon,
}: {
  title: string;
  subtitle: string;
  count: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
          {icon}
        </div>

        <span className="text-2xl font-black text-gray-900">
          {count}
        </span>
      </div>

      <h2 className="mt-4 font-black text-gray-900">
        {title}
      </h2>

      <p className="mt-1 break-words text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-6 text-gray-800">
        {value}
      </p>
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
  detailsFor,
  phone,
  setPhone,
  setCancelFor,
  setDetailsFor,
  onCancel,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  bookings: Booking[];
  emptyText: string;
  cancelFor: string | null;
  detailsFor: string | null;
  phone: string;
  setPhone: (value: string) => void;
  setCancelFor: (value: string | null) => void;
  setDetailsFor: (value: string | null) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-black text-gray-900">
            {title}
          </h2>

          <p className="break-words text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center sm:p-8">
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
              detailsFor={detailsFor}
              phone={phone}
              setPhone={setPhone}
              setCancelFor={setCancelFor}
              setDetailsFor={setDetailsFor}
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
  detailsFor,
  phone,
  setPhone,
  setCancelFor,
  setDetailsFor,
  onCancel,
}: {
  booking: Booking;
  cancelFor: string | null;
  detailsFor: string | null;
  phone: string;
  setPhone: (value: string) => void;
  setCancelFor: (value: string | null) => void;
  setDetailsFor: (value: string | null) => void;
  onCancel: (id: string) => void;
}) {
  const statusClasses: Record<string, string> = {
    pending:
      "bg-amber-50 text-amber-700 border border-amber-200",
    confirmed:
      "bg-blue-50 text-blue-700 border border-blue-200",
    completed:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled:
      "bg-red-50 text-red-700 border border-red-200",
  };

  const canCancel =
    booking.status === "pending" ||
    booking.status === "confirmed";

  const bookingId = booking.id;

  const showDetails =
    bookingId !== undefined &&
    detailsFor === bookingId;

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="min-w-0 break-words font-black text-gray-900">
                {booking.businessName}
              </h3>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-black capitalize ${
                  statusClasses[booking.status] ??
                  "border border-gray-200 bg-gray-100 text-gray-600"
                }`}
              >
                {booking.status}
              </span>
            </div>

            <p className="mt-1 break-words text-sm font-semibold text-gray-600">
              {booking.service}
            </p>

            <div className="mt-3 flex min-w-0 flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:gap-x-4">
              <span className="inline-flex min-w-0 items-start gap-1">
                <CalendarCheck
                  size={14}
                  className="mt-0.5 shrink-0"
                />

                <span className="break-words">
                  {booking.date}
                </span>
              </span>

              <span className="inline-flex min-w-0 items-start gap-1">
                <Clock3
                  size={14}
                  className="mt-0.5 shrink-0"
                />

                <span className="break-words">
                  {booking.timeSlot}
                </span>
              </span>

              {booking.address && (
                <span className="inline-flex min-w-0 items-start gap-1">
                  <MapPin
                    size={14}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="break-words">
                    {booking.address}
                  </span>
                </span>
              )}
            </div>

            {booking.notes && (
              <p className="mt-3 break-words rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                <strong>Notes:</strong> {booking.notes}
              </p>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
            {bookingId && (
              <button
                type="button"
                onClick={() =>
                  setDetailsFor(
                    showDetails ? null : bookingId
                  )
                }
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 sm:w-auto"
              >
                <Eye size={14} />

                {showDetails
                  ? "Hide Details"
                  : "View Details"}
              </button>
            )}

            {booking.userPhone && (
              <a
                href={`tel:${booking.userPhone.replace(
                  /\s+/g,
                  ""
                )}`}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              >
                <Phone size={14} />
                Support
              </a>
            )}

            {canCancel &&
              (cancelFor === bookingId ? (
                <div className="flex w-full flex-col gap-2 rounded-xl border border-red-100 bg-red-50 p-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
                  <input
                    type="tel"
                    placeholder="Phone on booking"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs outline-none focus:border-[#1a2d5c] sm:w-40"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (bookingId) {
                        onCancel(bookingId);
                      }
                    }}
                    className="w-full rounded-lg bg-red-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 sm:w-auto"
                  >
                    Confirm Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCancelFor(null);
                      setPhone("");
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (bookingId) {
                      setCancelFor(bookingId);
                      setPhone("");
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 sm:w-auto"
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
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
            >
              <RotateCcw size={14} />
              Rebook
            </button>
          </div>
        </div>
      </div>

      {/* DETAILS + STATUS TRACKER */}
      {showDetails && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-5">
          <h4 className="font-black text-gray-900">
            Booking Details
          </h4>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Detail
              label="Service"
              value={booking.service}
            />

            <Detail
              label="Business"
              value={booking.businessName}
            />

            <Detail
              label="Date"
              value={booking.date}
            />

            <Detail
              label="Time"
              value={booking.timeSlot}
            />

            <Detail
              label="Address"
              value={booking.address || "Not provided"}
            />

            <Detail
              label="Notes"
              value={booking.notes || "No notes"}
            />
          </div>

          {booking.status !== "cancelled" && (
            <StatusTracker status={booking.status} />
          )}

          {booking.status === "cancelled" && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              <XCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0">
                <p>Booking Cancelled</p>

                <p className="mt-1 break-words text-xs font-medium leading-5 text-red-600">
                  This booking is no longer active.
                </p>
              </div>
            </div>
          )}
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
  const currentIndex =
    status === "pending"
      ? 0
      : status === "confirmed"
        ? 1
        : status === "completed"
          ? 2
          : -1;

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-gray-800">
            Booking Status
          </p>

          <p className="text-xs leading-5 text-gray-500">
            Track your service progress in real time.
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#1a2d5c]/10 px-3 py-1 text-xs font-black capitalize text-[#1a2d5c]">
          {status}
        </span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        {/* DESKTOP TRACKER */}
        <div className="hidden sm:block">
          <div className="relative">
            <div className="absolute left-[16.67%] right-[16.67%] top-5 h-1 rounded-full bg-gray-200" />

            <div
              className="absolute left-[16.67%] top-5 h-1 rounded-full bg-[#1a2d5c] transition-all duration-500"
              style={{
                width:
                  currentIndex <= 0
                    ? "0%"
                    : currentIndex === 1
                      ? "33.33%"
                      : "66.66%",
              }}
            />

            <div className="relative grid grid-cols-3 gap-4">
              {STATUS_STEPS.map((step, index) => {
                const completed = index < currentIndex;
                const active = index === currentIndex;

                return (
                  <div
                    key={step.key}
                    className="flex min-w-0 flex-col items-center text-center"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition-all duration-300 ${
                        completed || active
                          ? "border-[#1a2d5c] bg-[#1a2d5c] text-white"
                          : "border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 size={19} />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <p
                      className={`mt-3 text-sm font-black ${
                        completed || active
                          ? "text-[#1a2d5c]"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>

                    <p className="mt-1 max-w-[170px] text-xs leading-5 text-gray-500">
                      {step.description}
                    </p>

                    {active && (
                      <span className="mt-2 rounded-full bg-[#1a2d5c]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a2d5c]">
                        Current Status
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MOBILE TRACKER */}
        <div className="space-y-4 sm:hidden">
          {STATUS_STEPS.map((step, index) => {
            const completed = index < currentIndex;
            const active = index === currentIndex;

            return (
              <div
                key={step.key}
                className="flex gap-3"
              >
                <div className="flex shrink-0 flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${
                      completed || active
                        ? "border-[#1a2d5c] bg-[#1a2d5c] text-white"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      index + 1
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

                <div className="min-w-0 pt-1">
                  <p
                    className={`text-sm font-black ${
                      completed || active
                        ? "text-[#1a2d5c]"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-gray-500">
                    {step.description}
                  </p>

                  {active && (
                    <span className="mt-2 inline-block rounded-full bg-[#1a2d5c]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a2d5c]">
                      Current Status
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3 shadow-sm">
      <p className="text-xs font-bold uppercase text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold leading-6 text-gray-700">
        {value}
      </p>
    </div>
  );
}