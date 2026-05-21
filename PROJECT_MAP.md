# PROJECT_MAP: خطوة (Khatwa) — Inclusive Education Management Platform

## [TECH_STACK] — Versions in use (built & verified 2026-05-10)

### Frontend (Web)
| Technology | Version | Status |
|---|---|---|
| Next.js | 14.2.5 | Built ✓ |
| React | 18.3.1 | Built ✓ |
| TypeScript | 5.5.4 | Built ✓ |
| CSS (custom variables) | — | Built ✓ |
| Google Fonts (Cairo) | — | Added ✓ |
| next-pwa | 5.6.0 | PWA enabled (service worker + manifest) |

### UI Design System (2026-05-10 redesign)
| Token | Value | Usage |
|---|---|---|
| Primary | `#2F80ED` | Buttons, links, active nav, charts |
| Accent Green | `#6FCF97` | Success states, completion indicators |
| Purple | `#9B8AFB` | Media bank cards, decorative |
| Background | `#F5F7FA` | Page background |
| Text Primary | `#2D3436` | Body text |
| Text Muted | `#7F8C8D` | Secondary text |
| Border | `#EAECEF` | Dividers, card borders |
| Card Radius | `20px` | Cards, login, modals |
| Button Radius | `12px` | Buttons, inputs |
| Shadow | `0 4px 12px rgba(0,0,0,0.04)` | Cards |
| Font | Cairo (sans-serif) | All UI text |
| Sidebar Width | `280px` | Desktop navigation |
| Active Nav | `bg #EAF3FF, color #2F80ED` | Selected nav item |

### UI Components Added/Redesigned
- **Stat cards**: Gradient colored cards (blue/green/purple/orange) for dashboard metrics
- **Progress ring**: SVG-based circular progress indicator (donut-style)
- **Sidebar icons**: Inline SVG icons for each nav item with active state
- **Profile header**: Avatar circle + student info layout for student profile page
- **Tabs redesign**: Pill-style tab bar with active highlight
- **Login page**: Gradient background, icon header, refined card
- **ConfirmDialog**: Reusable modal for delete/destructive confirmations (ESC, overlay-click to close, loading state, danger variant). Replaces `window.confirm()` and ad-hoc modals across `students/index`, `users`, `media`, `daily-plan`.
- **EmptyState**: Reusable empty state with SVG illustration, optional title, message, and action button/link. Applied to all list pages (students, behavior, ABC, RTI, FBA, early-warning, notifications, media, daily-plan, dashboard).
- **Table Sorting**: Sortable column headers on students page (`students/index`). Click header to sort asc/desc, visual indicator (▲/▼), client-side sort on current page data. Fields: id, name, disability type, diagnosis, status.

### Mobile
| Technology | Version | Status |
|---|---|---|
| Flutter | 3.41.5 | Structure created (needs SDK to compile) |
| Dart | 3.x | Structure created |

### Backend
| Technology | Version | Status |
|---|---|---|
| NestJS | 10.x | Built ✓ |
| FastAPI | 0.136.1 | Built ✓ (ai-service/) |
| Node.js | 24.15.0 | Built ✓ |
| Python | 3.13+ | ai-service ✓ |
| PDFKit | latest | Built ✓ (PDF export) |
| Winston | latest | Built ✓ (async logging) |

### Database & Storage
| Technology | Version | Status |
|---|---|---|
| PostgreSQL | 18 | Docker Compose ✓ |
| Redis | 8.6 | Docker Compose ✓ |
| MinIO | latest | Docker Compose ✓ |

### Infrastructure
| Technology | Version | Status |
|---|---|---|
| Docker Engine | 29.x | docker-compose.yml ✓ |
| GitHub Actions | — | .github/ present ✓ |

---

## [SYSTEM_FLOW] — Data Flow for Core Scenario

```
Teacher submits assessment (Web / Mobile)
        │
        ▼
  Next.js API Route (BFF) or Flutter HTTP
        │
        ▼
  NestJS Backend (Monolith, Auth + JWT)
        │
        ├──▶ PostgreSQL 18 (write assessment, plans, goals)
        │
        ├──▶ FastAPI AI Service (recommendation + prediction)
        │         │
        │         ▼
        │    Returns media suggestions / risk alerts
        │
        └──▶ Notifications Module (DB-backed, push-ready)
                  │
                  ▼
           Push Notification / Polling → Dashboard update
```

### User Journeys (Verifiable) — All Implemented

1. **Teacher Journey**: Login → Dashboard (summary + weekly chart) → Student list → Student profile (info, IEP plans/goals, behavior tracking) → Add goal → Update progress → View progress bar
2. **Parent Journey**: Login → View student progress → Receive notification → View and download IEP PDF report
3. **Admin Journey**: Login → Dashboard → Manage students → Media library upload → Export CSV/PDF reports → Change password in Settings
4. **Mobile (Flutter)**: Login → Dashboard stats → Student list → Student profile with IEP goals

---

## [ARCHITECTURE] — Surgical Architecture (Simplicity First)

### Principle: Monolith-first, extract only proven bottlenecks

### Scope-Based Access Control (2026-05-14)
- **admin / admin_manager**: Unrestricted — see all students across all levels
- **deputy_directorate**: Scoped to their `directorate` — only sees students in that directorate
- **school_principal / teacher_m / teacher_f**: Scoped to their `schoolName` — only sees students in that school
- Scope filter applied in `core/scope.utils.ts:buildScopeFilter()`, consumed by `StudentsService` and `ReportsService.getSummary()`
- Location fields (`governorate`, `directorate`, `administration`, `schoolName`) are included in JWT payload and available as `req.user` via `JwtStrategy.validate()`

```
┌───────────────────────────────────────┐
│          Frontend Layer               │
│  ┌─────────────┐  ┌──────────────┐   │
│  │ Next.js 14  │  │ Flutter 3.41 │   │
│  │ Web App     │  │ Mobile App   │   │
│  └──────┬──────┘  └──────┬───────┘   │
└─────────┼────────────────┼───────────┘
          │ HTTP (JWT)     │ HTTP (JWT)
┌─────────▼────────────────▼───────────┐
│         NestJS Monolith              │
│  ┌──────────────────────────────────┐│
│  │ Modules:                         ││
  │  │ Auth (JWT + RBAC + change pwd +  ││
  │  │   profile + 6 roles + location)  ││
  │  │ Locations (27 Egyptian governor- ││
  │  │   ates + directorates + adminis) ││
│  │ Students (CRUD + cascade delete) ││
│  │ IEP (Plans + Goals + status)     ││
│  │ Media (Upload + list + delete)   ││
│  │ Notifications (CRUD + unread)    ││
  │  │ Behavior (assessments + trends)  ││
  │  │ Inclusion (accommodations CRUD)  ││
  │  │ Reports (summary + PDF + CSV)    ││
  │  │ DailyPlan (CRUD by date/student) ││
  │  └──────────────────────────────────┘│
└────────────────┬─────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
PostgreSQL 18  Redis 8.6   MinIO (files)
                 │
    ┌────────────┘
    ▼
FastAPI AI Service
  /api/ai/recommend-media
  /api/ai/predict-progress
  /api/ai/health
```

### Backend Security Improvements (2026-05-21)
- **ParseIntPipe** on all `@Param()` in 19 controllers — prevents 500 errors from garbage input
- **Password leak protection** — `@Exclude()` on `User.password` + global `ClassSerializerInterceptor` (defense-in-depth)
- **Rate limiting** — 10 req/min on `/auth/login` (was present)
- **Cascade delete** — `students.service.ts.remove()` now deletes attendance, ABC, FBA, RTI, risk events, behavior assessments, daily plans when a student is removed
- **Health check** — `GET /health` endpoint (was present)

### Frontend Improvements (2026-05-21)
- **Error boundary** — `ErrorBoundary` component wrapping `_app.tsx` prevents full-app crash
- **AbortController** — 15s default timeout in `apiFetch()` + polling cleanup in AppShell
- **404 page** — Arabic custom 404 (`pages/404.tsx`)
- **Search debounce** — 300ms delay on students page search input
- **LRE field** — Added to `Student` entity (frontend form not yet updated)

### Backend Module Map (as implemented)

```
backend/src/
├── core/              # LoggerModule, LoggingInterceptor, RolesGuard, scope.utils, pdfkit.d.ts
├── auth/              # JWT login, change-password, RBAC, User entity, profile (governorate/directorate/administration/schoolName), location hierarchy API, JWT payload includes location fields for scope
├── students/          # CRUD with cascade delete (plans + goals + assessments), scoped by user's directorate/schoolName
├── iep/               # Plans, Goals, progress tracking, relations
├── media/             # File upload (multer), local FS storage, metadata in DB
├── notifications/     # User-scoped notifications, unread count, mark-read
├── behavior/          # Behavioral assessments with JSONB indicators
├── inclusion/         # Accommodations CRUD
├── daily-plan/        # CRUD by date + studentId, status/priority/type fields
├── locations/         # Egyptian governorates + directorates + administrations (seeded)
└── reports/           # Summary stats (scoped by user's directorate/schoolName), PDF generation (PDFKit), CSV export
```

### Frontend Pages (as implemented)

```
frontend/pages/
├── index.tsx              # Auto-redirect
├── 404.tsx                # Arabic custom 404 page (added 2026-05-21)
├── login.tsx              # JWT login form (RTL Arabic, new design with gradient + icon)
├── dashboard.tsx          # User info card (role + location) + gradient stat cards + donut charts + bar chart
├── students/
│   ├── index.tsx          # Student list table with pill status badges
│   ├── new.tsx            # Create student form
│   ├── [id].tsx           # Profile (avatar header + age + info/IEP/progress tabs + SVG rings + dev timeline + performance level)
│   └── behavior/[id].tsx  # Behavioral slider-based assessment form
├── media.tsx              # Upload + list + delete media files
├── daily-plan.tsx         # Date picker + stat cards + CRUD with student name dropdown
├── reports.tsx            # Summary + PDF/CSV export per student
├── notifications.tsx      # Notification list + mark read
├── settings.tsx           # Profile (governorate/directorate/administration/schoolName) + change password + system info
```

### Frontend Components (redesigned)

```
frontend/components/
├── AppShell.tsx           # Sidebar 280px + nav with SVG icons + notifications badge + footer logout
├── ConfirmDialog.tsx      # Reusable confirm modal for delete/destructive actions (ESC to close, Escape key, loading state, danger styling)
├── EmptyState.tsx         # Empty state with SVG illustration, title, message, optional action button/link
├── Spinner.tsx            # Loading spinner (sm/lg)
└── Toast.tsx              # Toast notification system (context + provider + auto-dismiss)
```

---

## [IMPROVEMENTS COMPLETED — 2026-05-21 Surgical Edit]

| # | Item | Phase | Files Changed |
|---|---|---|---|
| 1 | **ParseIntPipe** on all `@Param()` in 19 controllers | 1 — Security | All controller files |
| 2 | **Password leak fix** — `@Exclude()` on `user.entity.ts` + global `ClassSerializerInterceptor` | 1 — Security | `user.entity.ts`, `app.module.ts` |
| 3 | **Rate limiting** on `/auth/login` — 10 req/min (already present) | 1 — Security | `auth.controller.ts` (pre-existing) |
| 4 | **Error boundary** in `_app.tsx` — prevents full-app crash | 1 — Stability | `ErrorBoundary.tsx` (new), `_app.tsx` |
| 5 | **Cascade delete** — students.service.ts now deletes attendance, ABC, FBA, RTI, risk events, behavior, daily plans on student removal | 1 — Stability | `students.service.ts` |
| 6 | **AbortController** — 15s default timeout in apiFetch + polling cleanup in AppShell | 1 — Stability | `api.ts`, `AppShell.tsx` |
| 9 | **LRE tracking field** added to `student.entity.ts` | 2 — Feature | `student.entity.ts` |
| 11 | **Health check** endpoint `GET /health` (pre-existing) | 2 — Feature | `health.controller.ts` |
| 12 | **404 page** — Arabic custom 404 | 3 — UX | `pages/404.tsx` (new) |
| 21 | **Search debounce** — 300ms on students page | 4 — DX | `pages/students/index.tsx` |

## [ORPHANS & PENDING]

| Item | Status | Priority | Notes |
|---|---|---|---|
| Keyboard navigation + focus trap (Modal/ConfirmDialog) | PENDING | High | WCAG 2.1 AA |
| aria-label on all icon buttons | PENDING | High | Accessibility |
| Loading skeletons on all pages | PENDING | Medium | UX polish |
| Skip-link + visible focus indicators | PENDING | High | WCAG 2.1 AA |
| NEXT_PUBLIC_API_URL env var in .env.local | PENDING | Low | Already partially supported |
| Compliance deadline enforcement (IEP review, eval due) | PENDING | High | IDEA compliance |
| Spinner/loading state on mutation buttons | PENDING | Medium | Prevents double-submit |
| Arabic NLP model selection | DEFERRED | Medium | Phase 3 — Evaluate ArBERT, CAMeL Tools vs Azure Cognitive |
| Speech therapy AI integration | DEFERRED | Low | Phase 3+ |
| Computer vision for behavior monitoring | DEFERRED | Low | Phase 3+ (privacy concerns) |
| IoT device integration | DEFERRED | Low | Future roadmap |
| WhatsApp notification channel | DEFERRED | Medium | Need Twilio/BSP integration when demand arises |
| Multi-language i18n framework | DEFERRED | Medium | next-intl for Next.js if needed |
| Accessibility audit (WCAG 2.1 AA) | DEFERRED | High | Manual audit needed before production launch |
| HIPAA/GDPR compliance checklist | DEFERRED | High | Legal review needed before production |
| Load testing benchmarks (k6) | DEFERRED | Medium | Add k6 scripts before production scale |
| Backup/DR strategy (pg_dump) | DEFERRED | Medium | Add cron pg_dump and S3 sync |
| JWT token refresh on profile location update | DEFERRED | Medium | Location fields in JWT become stale if user updates profile; needs re-login or token refresh |
| Integration tests (controller + DB) | DEFERRED | Medium | Add after production stabilization |
| Co-locate page CSS from globals.css | DEFERRED | Low | Refactoring |

---

## [LOGGING_STRATEGY]

**Async structured JSON logging** — non-blocking, zero-impact on request pipeline.

```
Levels: ERROR | WARN | INFO | DEBUG (no TRACE in production)
Output: stdout (container) → Loki/Grafana
Library: Winston (NestJS) + structlog (Python)
```

Rules:
- No sensitive data (PII must be masked via interceptor)
- Correlation ID per request (x-request-id header)
- AI service logs sampled at 10% in production
- Audit log stored in dedicated PostgreSQL table (immutable)
