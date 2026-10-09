# Quad — University Management System (frontend)

Next.js frontend for the [UMS API](https://github.com/abid-arham/assignment-6) (B7A6). Students register for courses and pay tuition, instructors grade their sections, and the registrar runs the catalogue — each in its own role-based workspace.

| | |
|---|---|
| Live site | https://assignment-7-three-xi.vercel.app/ |
| Live API | https://assignment-6-tau-wine.vercel.app/api/v1 |
| Backend repo | https://github.com/abid-arham/assignment-6 |
| Demo video |  |

## Demo accounts

The login page has **one-click demo buttons** for every role. To sign in by hand:

| Role | Email | Password |
|---|---|---|
| Admin (registrar) | `admin@ums.demo` | `Passw0rd!` |
| Student | `student1@ums.demo` | `Passw0rd!` |
| Instructor | `instructor1@ums.demo` | `Passw0rd!` |

Stripe runs in test mode: pay with `4242 4242 4242 4242`, any future expiry date and any CVC.

## What each role can do

**Student** (`/dashboard`)
- Overview of GPA, credits, active courses and balance.
- Course registration with a persisted plan. Credits and tuition are estimated as you add sections. Each section is registered separately, so a missing prerequisite or a full section shows a readable reason without blocking the rest.
- Enrollment history with status tabs, plus an optimistic drop.
- Printable transcript: term GPA, cumulative GPA, retake handling and a grade chart.
- Tuition invoices: generate or recalculate, pay with Stripe Checkout, then land on the success or cancel page. Includes payment attempt history.
- Profile: name, plus avatar upload with a preview and progress bar. Images go to Cloudinary through the API.

**Instructor** (`/instructor`)
- Sections grouped by semester, with seat fill and how many grades are still to submit.
- Section roster with search and status filters. Grade entry asks for confirmation, then updates optimistically.
- Grade analytics: grade distribution, average grade point per section, seat fill and pass rate.

**Admin** (`/admin`)
- Dashboard with charts: 14-day activity from the audit log, users by role, seats by department, and paid vs outstanding invoices.
- Users: search, role filter, role changes (with confirmation) and an optimistic activate/deactivate switch.
- Courses: catalogue table, edit dialog and soft delete. A **4-step "New course" wizard** whose draft survives a refresh. A course detail page manages prerequisites; cyclic chains are rejected.
- Departments, semesters (date and tuition validation, optimistic enrollment toggle) and sections (capacity can't drop below current enrollment).
- Audit log filtered by record type and action, with a metadata viewer.

**Public:** home page with live figures, course catalogue and course pages, tuition with a fee calculator and FAQ, about, contact, login and register.

## Architecture

```
proxy.ts                      route protection + silent token refresh (Next 16's middleware)
app/
  (public)/                   static/ISR marketing + catalogue pages
  (auth)/                     login (with demo login), register
  (dashboard)/                shared shell; dashboard/ (student), instructor/, admin/
  payment/                    Stripe success / cancel landing pages
  api/proxy/[...path]/        backend-for-frontend: forwards browser calls with the httpOnly token
  api/auth/{refresh,session}/ token rotation and "who am I" for public pages
lib/api/                      typed endpoints, server/browser transports, TanStack query factories
lib/auth/                     server actions, cookie + JWT helpers, role routing
lib/validations/              Zod schemas mirroring the API's validation
stores/                       Zustand: registration plan, course-wizard draft
components/                   ui/ (shadcn), shared/, charts/, dashboard/, admin/, student/, instructor/, site/
```

**Authentication and authorization**
- The API's access and refresh tokens live only in **httpOnly cookies**: `ums_at` expires with the JWT, and `ums_rt` lasts 7 days. Client JavaScript never sees them.
- `proxy.ts` verifies the access token's signature with `jose` and enforces the role of each area: `/dashboard` is students only, `/instructor` instructors only, `/admin` admins only, and `/payment` requires any signed-in user.
  - Signed-out visitors go to `/login?next=…`.
  - Signed-in users who open the wrong area go to their own home.
- **Silent refresh:**
  - When the access token is missing or about to expire, `proxy.ts` rotates the pair and passes the new cookie to the same render.
  - In the browser, a `SessionKeeper` renews about 90 s before expiry.
  - A single-flight refresh retries any request that gets a 401. Prefetches never rotate tokens, which avoids revoke races.
- Each role layout re-checks the role on the server (defense in depth). Server actions validate their input again with Zod.
- Demo credentials stay on the server: the button only sends a role.

**Data fetching and state**
- **Public pages:** Server Components with Next's data cache (`revalidate: 60`). The catalogue's filters use `router.replace` in a transition, so the server re-renders while the current results stay visible.
- **Dashboards:** the server prefetches with TanStack Query and hands the data over through `HydrationBoundary`. Client components then use the same query factory, so the keys match and nothing is fetched twice.
  - Filters, search and pagination use `history.pushState`, so changing them makes no server round-trip.
  - Each view is cached by TanStack Query, which you can see in the Network tab and in React Query Devtools.
- **URL state:** every filter, sort, search and page lives in the URL. Shared Zod parsers give the server and the client identical params.
- **Optimistic updates:** dropping a course, submitting a grade, activating/deactivating a user and toggling semester enrollment. Each rolls back and shows a toast on error.
- **Global client state:** Zustand holds the registration plan (`localStorage`, scoped to the student) and the course-wizard draft (`sessionStorage`).
- **Loading and errors:** every data route has a page-shaped `loading.tsx`. `error.tsx` boundaries exist per area, plus `global-error.tsx`. API failures raise sonner toasts, and 422 field errors are mapped onto the matching form fields.

**Forms:** React Hook Form with Zod. The schemas mirror the backend's rules (credits 1–6, end date after start date, capacity ≥ current enrollment, password 8–72 characters, and so on). Validation runs as you go, with human-readable messages.

**Performance:**
- Recharts loads lazily through `next/dynamic`, with chart-shaped skeletons.
- All images use `next/image`, including Cloudinary avatars.
- Public pages are static or ISR, and Server Components are the default.
- Fonts come from `next/font`.

**SEO:** Metadata API on every public page, `generateMetadata` for course pages, a generated Open Graph image, `robots.txt` and `sitemap.xml`.

## Pages (30 + custom 404)

`/`, `/about`, `/courses`, `/courses/[id]`, `/tuition`, `/contact` · `/login`, `/register` · `/dashboard`, `/dashboard/register`, `/dashboard/enrollments`, `/dashboard/transcript`, `/dashboard/payments`, `/dashboard/profile` · `/instructor`, `/instructor/sections/[id]`, `/instructor/analytics`, `/instructor/profile` · `/admin`, `/admin/users`, `/admin/courses`, `/admin/courses/new`, `/admin/courses/[id]`, `/admin/departments`, `/admin/semesters`, `/admin/sections`, `/admin/audit-logs`, `/admin/profile` · `/payment/success`, `/payment/cancel` · custom 404 · error boundaries.

## Running locally

Requires Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local     # then fill in JWT_ACCESS_SECRET
pnpm dev                       # http://localhost:3000
```

| Variable | Required | Purpose |
|---|---|---|
| `API_BASE_URL` | yes | UMS API base URL including `/api/v1` (server-only) |
| `JWT_ACCESS_SECRET` | yes | Same value as the API's `JWT_ACCESS_SECRET`; `proxy.ts` uses it to verify sessions |
| `FRONT_END_URL` | recommended in production | Public URL of this site (metadata, Open Graph, sitemap). Defaults to the Vercel production domain |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Address used by the contact page |
| `DEMO_*_EMAIL` / `DEMO_*_PASSWORD` | no | Override the demo-login accounts (defaults match the API seed) |

For Stripe to send students back to this app, set `FRONTEND_URL=<this site's URL>` on the **API** deployment.

| Script | |
|---|---|
| `pnpm dev` | development server |
| `pnpm build` / `pnpm start` | production build / serve |
| `pnpm lint` | ESLint, including the React Compiler rules |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict, no `any`) · Tailwind CSS v4 · shadcn/ui (Radix) · TanStack Query 5 · Zustand 5 · React Hook Form + Zod 4 · Recharts · jose · sonner · next-themes · lucide-react · deployed on Vercel.
