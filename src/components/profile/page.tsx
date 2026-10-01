"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { getStoredBookingIds } from "@/lib/customerBookingIds";
import type { Booking } from "@/lib/types";

export default function MyBookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [cancelFor, setCancelFor] = useState<string | null>(null);

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
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="animate-spin" size={20} />
        Loading your bookings…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1a2d5c]">
          Customer Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-900">
          My Bookings
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Track and manage your service bookings in one place.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Upcoming"
          count={upcoming.length}
          icon={<Clock3 size={20} />}
        />

        <SummaryCard
          title="Completed"
          count={completed.length}
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          title="Cancelled"
          count={cancelled.length}
          icon={<XCircle size={20} />}
        />
      </div>

      <BookingSection
        title="Upcoming"
        description="Pending and confirmed bookings"
        icon={<Clock3 size={20} />}
        bookings={upcoming}
        emptyText="No upcoming bookings."
        cancelFor={cancelFor}
        phone={phone}
        setPhone={setPhone}
        setCancelFor={setCancelFor}
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
        setPhone={setPhone}
        setCancelFor={setCancelFor}
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
        setPhone={setPhone}
        setCancelFor={setCancelFor}
        onCancel={cancel}
      />
    </div>
  );
}

function SummaryCard({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
          {icon}
        </div>

        <span className="text-2xl font-black text-gray-900">
          {count}
        </span>
      </div>

      <h2 className="mt-4 font-black text-gray-900">{title}</h2>
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
  setPhone,
  setCancelFor,
  onCancel,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  bookings: Booking[];
  emptyText: string;
  cancelFor: string | null;
  phone: string;
  setPhone: (value: string) => void;
  setCancelFor: (value: string | null) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#1a2d5c]">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900">{title}</h2>

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
              setPhone={setPhone}
              setCancelFor={setCancelFor}
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
  setPhone,
  setCancelFor,
  onCancel,
}: {
  booking: Booking;
  cancelFor: string | null;
  phone: string;
  setPhone: (value: string) => void;
  setCancelFor: (value: string | null) => void;
  onCancel: (id: string) => void;
}) {
  const statusClasses = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const canCancel =
    booking.status === "pending" ||
    booking.status === "confirmed";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-black text-gray-900">
              {booking.businessName}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                statusClasses[booking.status]
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
          <a
            href={`tel:${booking.userPhone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <Phone size={14} />
            Support
          </a>

          {canCancel &&
            (cancelFor === booking.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="tel"
                  placeholder="Phone on booking"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[#1a2d5c]"
                />

                <button
                  type="button"
                  onClick={() =>
                    booking.id && onCancel(booking.id)
                  }
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
    </article>
  );
}