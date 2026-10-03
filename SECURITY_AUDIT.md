# Security Audit Report

## Seva Sansaar — Security Audit, RBAC & API Rate Limiting

### Authentication & Authorization
- Customer/user APIs use Firebase authentication via `requireAuth()` / `verifyToken()`.
- Admin APIs use `requireAdminApi()`.
- Owner/partner APIs use validated owner credentials through `parseOwnerAuth()`.
- Business mutations require admin authorization.

### RBAC / Access Control
The current codebase enforces separate access boundaries for:
- Authenticated users/customers
- Administrators
- Business owners/partners

A general Firebase `customer` / `partner` / `artisan` custom-claims role system was not found, so no unsupported role system was introduced.

### API Rate Limiting
Rate limiting is implemented through `src/lib/rate-limiter.ts` for:
- Booking creation
- Booking status updates
- Business search and lookup
- Business registration
- Business mutations
- Nearby provider search
- Owner login
- Reviews
- Analytics
- SevaBot
- Skills tests
- Booking batch operations

The nearby-provider endpoint was additionally protected during this audit with an IP-based rate limit.

### Booking Creation
`POST /api/bookings`:
- Uses `BOOKING_CREATE` rate limiting.
- Returns HTTP `429` when the limit is exceeded.
- Sends a `Retry-After` header.
- Verifies Firebase authentication for authenticated bookings.
- Validates guest bookings.
- Sanitizes user-controlled fields.

### Supabase RLS
RLS is enabled for:
- `messages`
- `profiles`
- `calls`

Storage policies protect `chat-media` uploads.

The policies restrict messages and calls to the relevant authenticated users and restrict profile updates to the profile owner.

### Verification
- `npx tsc --noEmit` completed without TypeScript errors after the nearby-provider rate-limit change.
- API authentication and authorization coverage was reviewed across `src/app/api`.
- Rate-limit coverage was reviewed across the API routes.
- Supabase RLS policies were reviewed in `supabase_setup.sql`.

### Production Security Notes
The current rate limiter uses in-memory state and should use a shared store such as Redis/Upstash for horizontally scaled production deployments.

Owner authentication currently uses a Base64-encoded business ID and owner secret. The existing implementation documents migration to short-lived JWT authentication and secure password hashing as future hardening.

## Audit Result

The audited API surface contains authentication, authorization, rate limiting, and Supabase RLS controls covering the identified security requirements.

The report does not claim a general Firebase customer/partner/artisan custom-claims system because one is not currently present in the codebase.
