# PlacePrep Portal — Placement Training & Student Performance Management

A modern, enterprise-grade web application for managing placement preparation and student performance tracking across higher education institutions.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui-style component architecture**, **Recharts**, **Prisma ORM**, and **Supabase PostgreSQL & Auth**.

---


## Portals & Roles
1. **Student Portal** (`/student/*`):
   - Command Center Dashboard & Placement Readiness score gauge
   - Longitudinal multi-skill performance analytics (1M, 3M, 6M, 12M, All Time)
   - Timed coding assessment environment with split-pane code editor
   - Distraction-free aptitude examination room
   - Company-specific mock test catalogs (TCS, Infosys, Wipro, Amazon, etc.)
   - 3-Phase Placement Roadmap (Foundation, Current, Upcoming)
   - Deterministic, explainable personalized recommendations
   - Comprehensive student profile management



2. **Faculty Portal** (`/faculty/*`):
   - Cohort performance overview & early warning detection
   - Student directory with multi-column filtering, search, and sorting
   - Individual student deep-dive and confidential faculty notes
   - Assessment participation monitoring and score breakdown
   - Cohort analytics with score distribution histograms
   - Tiered student intervention center (Critical, Needs Attention, Monitoring, Improving)

3. **Management Portal** (`/management/*`):
   - Executive institutional overview and cross-department comparisons
   - University-wide student directory with bulk actions
   - Faculty roster management and assigned workloads
   - Assessment & Mock Test authoring and lifecycle management
   - Curriculum placement roadmaps configuration
   - Institutional report generator and data exporter
   - Granular Role-Based Access Control (RBAC) permission matrix
   - Immutable security audit trail
   - System, security, and proctoring settings

---

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Primitives**: Accessible [Radix UI](https://www.radix-ui.com/) components
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts 3](https://recharts.org/)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) with [Supabase PostgreSQL](https://supabase.com/)
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth) with Microsoft Entra ID (Azure AD) SSO

---

## Getting Started

### 1. Prerequisites
- Node.js v20+ (recommended v22+)
- npm v10+

### 2. Installation
```bash
git clone https://github.com/likithyadav128-tech/placement-portal.git
cd placement-portal
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and configure your Supabase connection strings and keys:
```bash
cp .env.example .env.local
```

### 4. Database Setup
```bash
# Push schema to Supabase PostgreSQL
npx prisma db push

# Seed development data
npm run prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the portal.

---

## Verification & Testing

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Security & RBAC automated tests
npm run test:security

# Production build
npm run build
```

---

## License
MIT License. Developed for University Placement Cell.
