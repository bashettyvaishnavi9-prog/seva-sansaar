import { Link } from "@/i18n/navigation";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="mx-auto max-w-5xl px-4">
        <nav className="mb-8 flex flex-wrap gap-4 border-b border-gray-200 pb-4 text-sm font-bold">
          <Link
            href="/profile"
            className="text-[#1a2d5c] hover:underline"
          >
            Dashboard
          </Link>

          <Link
            href="/profile/bookings"
            className="text-[#1a2d5c] hover:underline"
          >
            My bookings
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}