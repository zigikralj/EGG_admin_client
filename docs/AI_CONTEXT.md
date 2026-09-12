# AI Quick Context — Ekos Project Tracker Client

> **Purpose:** This file gives AI assistants fast orientation to the client-side codebase.
> Read this file FIRST when working on the client project.

---

## What Is This Project?

A **React 19 + TypeScript + MUI v9 SPA** for managing environmental services projects (waste management, permits, sampling schedules, invoicing) for Ekos Green Group, a Serbian environmental company. Built with **Vite 8** and deployed to GitHub Pages.

The client talks to a separate Express 5 REST API server (see `../server/`).

---

## Quick File Map

### Entry & Boot
| File | Purpose |
|---|---|
| `index.html` | HTML shell — mounts `#root` |
| `src/main.tsx` | ReactDOM entry. Wraps `<App />` in StrictMode. Handles `vite:preloadError` auto-reload. |
| `src/App.tsx` | **Root orchestrator** (~640 lines). Provider wiring, domain hook composition, lazy-loaded views, modal management, and view routing (no react-router — uses `activeTab` state). |
| `vite.config.ts` | Vite + React plugin, dev proxy `/api` → `:5000`, manual chunk splitting (vendor-react, vendor-mui, vendor-mui-charts, vendor-mui-icons), version.json generation. |

### Type Definitions
| File | Purpose |
|---|---|
| `src/types.ts` | **All TypeScript interfaces and types.** `Project`, `Client`, `Invoice`, `Service`, `Permit`, `WasteCatalog`, `User`, `Reminder`, `ProvidedService`, `Category`, `CompanyInfo`, `AppNotification`, plus `UserRole`, `InvoiceStatus`, `InvoiceCurrency`, `InvoiceType`, `ActiveTab`, `DashboardSubTab`, `ProvidedServicesSubTab`, `CustomFieldDefinition`, `SortState`, `TableViewProps`, `AppFetchers`, `SaveResult`, and the `typeGroup` service-category map. Global `__APP_VERSION__`, `__COMMIT_HASH__`, `__BUILD_TIME__` declarations. |

### API Layer
| File | Purpose |
|---|---|
| `src/api.ts` | `getApiUrl(path)` — resolves base URL. `apiFetch(input, init)` — wrapper around `fetch()` that auto-attaches JWT `Authorization` header + `X-User-Id` from localStorage, and dispatches `auth:expired` custom event on 401 (triggers auto-logout). |

### Context Providers (`src/context/`)
| File | Provider | Hook | Key Responsibilities |
|---|---|---|---|
| `AuthContext.tsx` | `AuthProvider` | `useAuth()` | Login/register/logout, JWT token & session expiry, role resolution (effective role via admin `roleView` switch), RBAC booleans (`isAdmin`, `isManager`, `isUser`, `isAccountant`, `canManage*`), `canEditUser()`, `canEditProject()`, periodic auth polling with Page Visibility API. |
| `LanguageContext.tsx` | `LanguageProvider` | `useLanguage()` | `t(key, params)` translation, `getServiceLabel()`, `getResponsibleLabel()` (gender-aware), `getErrorMessage()` — lazy-loads locale dictionaries. Default language: `sr-Latn`. |
| `ThemeContext.tsx` | `CustomThemeProvider` | `useThemeContext()` | Light/dark/system theme mode, system preference listener via `matchMedia`, syncs `data-theme` attribute on `<html>`. |
| `NotificationContext.tsx` | `NotificationProvider` | `useNotifications()` | Fetches, polls (25s intervals with Page Visibility pausing), and manages @mention notifications. Optimistic UI for mark-read/delete/clear-all. |

### Custom Hooks (`src/hooks/`)
| Hook | Purpose |
|---|---|
| `useAppData.ts` | **Orchestration hub.** Creates all 11 fetch functions via generic `useFetcher`, assembles `fetchAllData()` (parallel Promise.all), manages user preferences (GET/PUT `/api/preferences`). |
| `useCrudOperations.ts` | **Generic CRUD factory.** Accepts `basePath`, `items[]`, `authHeaders`, `onSuccess`, translation keys. Returns `handleSave(data)` (POST/PUT) and `handleDelete(id)` (with confirm dialog). Merges existing items on PUT. |
| `useProjects.ts` | Project state + `handleToggleDone`, `handleMarkSampled`, save/delete via `useCrudOperations`. |
| `useClients.ts` | Client state + CRUD via `useCrudOperations`. |
| `useUsers.ts` | User state + CRUD + `handleApproveUser`, `handleRejectUser`, `handleForceLogout` via `useStatusUpdate`. |
| `useServices.ts` | Service state + CRUD. |
| `useProvidedServices.ts` | ProvidedService state + CRUD. |
| `useCategories.ts` | Category state + CRUD. |
| `useReminders.ts` | Reminder state + CRUD + `handleStatusChange` via `useStatusUpdate`. |
| `useInvoices.ts` | Invoice state + CRUD + `handleUpdateInvoiceStatus` via `useStatusUpdate`. |
| `usePermits.ts` | Permit + WasteCatalog state + CRUD. |
| `useProjectForm.ts` | Complex form state for project create/edit modal — manages name, client, responsible, type, dates, progress, notes, nested reminder/invoice sub-forms. |
| `useInvoiceFormState.ts` | Isolated form state for invoice create/edit — new/edit modes, line items, parent linking, currency, status. |
| `useTableView.ts` | **Shared table infrastructure.** Column visibility, pagination (rows-per-page + options), sorting (field + direction), refresh with spinner, error dialogs. Syncs local state ↔ controlled props from user preferences. Used by all 11 table-based views/panels. |
| `useVersionCheck.ts` | Polls `/version.json` to detect new deployments, shows update banner. Uses Page Visibility API. |
| `useRoleLabels.ts` | Maps `UserRole` strings to translated labels. |
| `useStatusUpdate.ts` | Generic status-change helper (PATCH to arbitrary endpoint). Used by reminders, invoices, user management. |

### Components

#### Layout Shell (`src/components/layout/`)
| File | Purpose |
|---|---|
| `AppHeader.tsx` | Top app bar — branding, user avatar menu, notification bell, pending users badge, user switch (admin), mobile hamburger. |
| `Sidebar.tsx` | Permanent sidebar (desktop) / temporary drawer (mobile). Nav items, dashboard sub-tabs, version chip. |
| `SettingsDialog.tsx` | User preferences — theme, language, entity work mode, rows-per-page customization. |
| `UserProfileDialog.tsx` | Profile view/edit — name, email, phone, gender, avatar, password change. |
| `NotificationsMenu.tsx` | Notification dropdown — mark read, delete, clear all, navigate to linked project. |

#### View Pages (`src/components/views/`)
| File | View | Notes |
|---|---|---|
| `DashboardView.tsx` | Dashboard | KPI header stats, sub-tabs (Projects, Reminders, Invoices, Waste Disposal, Waste Management, Statistics). Role-tailored: accountants see invoice-focused default. |
| `ProjectsView.tsx` | Projects | Table + card list, quick filters (Active, Missing Invoice, Stale, Late), column selector. |
| `ClientsView.tsx` | Clients | Table with permit linking, inline project/invoice counts. |
| `PermitsView.tsx` | Permits | Permit CRUD with waste catalog multi-select picker. |
| `UsersView.tsx` | Users | Status filters (All/Active/Pending/Blocked), approve/reject, force logout. |
| `ServicesView.tsx` | Services | Service type definitions with custom data model editor. |
| `ProvidedServicesView.tsx` | Provided Services | Service delivery records with sub-tabs (Summary, Statistics). |
| `CategoriesView.tsx` | Categories | Simple CRUD table. |
| `RemindersView.tsx` | Reminders | Status management, project/client/permit linking. |
| `InvoicesView.tsx` | Invoices | Full lifecycle management, parent/child linking, line items, currency support. |

#### Key Shared Components (`src/components/`)
| File | Purpose |
|---|---|
| `AdminLayout.tsx` | Page shell — wraps AppHeader + Sidebar + main content + profile/settings/company modals. Handles nav item visibility based on RBAC. |
| `ProjectCard.tsx` | Rich project card — progress bar, sampling controls, status chips, deadline alerts. |
| `ProjectModal.tsx` | Project create/edit dialog — uses `useProjectForm`, nested reminder/invoice sections. |
| `ProjectViewModal.tsx` | Read-only project detail view with all related data. |
| `StatisticsCharts.tsx` | Dashboard analytics — project status distribution, service category breakdown (MUI X Charts). |
| `ReminderPanel.tsx` | Dashboard reminder panel — approaching/overdue reminders table. |
| `ApproachingInvoicesPanel.tsx` | Dashboard invoice panel — invoices due soon with status management. |
| `WasteDisposalPanel.tsx` | Dashboard waste disposal panel — waste service tracking. |
| `ProvidedServicesStatistics.tsx` | Analytics charts for provided services (by status, category, monthly trend). |
| `RichTextEditor.tsx` | Custom rich text editor with @mention support, formatting toolbar, HTML output. |
| `CompanyInfoModal.tsx` | Company legal details editor (name, tax ID, bank accounts). |
| `ColumnSelector.tsx` | Column visibility picker for table views. |
| `DateRangeFilter.tsx` | Date range filter component. |
| `ConfirmDialog.tsx` / `ConfirmDeleteDialog.tsx` | Reusable confirmation modals. |
| `ErrorDialog.tsx` | Error display dialog. |
| `VersionUpdatePrompt.tsx` | Non-intrusive update banner when new version detected. |
| `icons.ts` | Barrel file — re-exports ~90 MUI icons as named per-file imports for tree-shaking. |

#### Feature Sub-Components
| Directory | Files | Purpose |
|---|---|---|
| `components/project/` | `ProjectInvoiceSection.tsx`, `ProjectProgressSlider.tsx`, `ProjectReminderSection.tsx` | Nested sections within project modal. |
| `components/shared/` | `InvoiceChips.tsx`, `InvoiceFormFields.tsx`, `InvoiceItemsList.tsx` | Shared invoice UI components (extracted during refactoring). |
| `components/providedService/` | `ProvidedServiceInvoiceSection.tsx` | Invoice management within provided service detail. |
| `components/auth/` | `LoginView.tsx` | Login/registration form. |

### Internationalization (`src/i18n/`)
| File | Purpose |
|---|---|
| `translations.ts` | Type definitions (`Language`, `TranslationKeys`), plus `serviceTypeTranslations` and `errorMessageTranslations` lookup maps. |
| `loader.ts` | Lazy-loads locale dictionaries via dynamic `import()`. |
| `locales/en.ts` | English translations. |
| `locales/sr-Latn.ts` | Serbian Latin translations (default). |
| `locales/sr-Cyrl.ts` | Serbian Cyrillic translations. |

### Theming (`src/theme/`)
| File | Purpose |
|---|---|
| `theme.ts` | MUI `createTheme` — green-focused palette (light + dark), custom `status` palette extension (`active`, `done`, `stale`, `sampled`), Inter font, component overrides (Card, Paper, Table, Button, Chip, Pagination, scroll-lock disabled on all modals/menus). |

### Utilities (`src/utils/`)
| File | Purpose |
|---|---|
| `invoiceUtils.ts` | `parseInvoiceNotes()` / `serializeInvoiceNotes()` — embeds invoice metadata (type, parent link) as HTML comment in notes field. `enhanceInvoicesWithLinks()` — resolves parent/child invoice relationships. |

### Styling
| File | Purpose |
|---|---|
| `src/index.css` | Global CSS — Inter font import, CSS variables for light/dark, scrollbar styling, table layout, responsive breakpoints, animations (fadeIn, slideInUp, pulse). |
| `src/App.css` | Additional component-specific styles. |

---

## Key Patterns & Conventions

### No Router
The app uses a simple `activeTab` state variable (type `ActiveTab`) instead of react-router. View switching is handled in `App.tsx` via a conditional render block. Sub-tabs exist for Dashboard (`DashboardSubTab`) and Provided Services (`ProvidedServicesSubTab`).

### Data Flow Architecture
```
App.tsx (root orchestrator)
  ├── Domain Hooks (useProjects, useClients, ...) — own state, expose setters
  ├── useAppData — creates fetch functions, wires setters to API responses
  ├── fetchersRef — breaks circular dependency between domain hooks and useAppData
  └── Views receive data + handlers as props
```

### RBAC Pattern & Developer Admin Rule
Roles are resolved through `AuthContext`:
1. `actualRole` — the user's real role from the server
2. `roleView` — admin can simulate any role (stored in `admin_role_view` localStorage)
3. `effectiveRole` — what's actually used for permission checks
4. Boolean flags: `isAdmin`, `isManager`, `isUser`, `isAccountant`, `canManage*`

> [!IMPORTANT]
> **CRITICAL RULE — Developer Administrator Visibility:**
> The developer operates using an Administrator account. Administrator level **MUST see everything and have full access to all features**.
> **NEVER hide any options, switches, menus, or features from Administrator.** If something is available to Manager, Accountant, or User, Administrator MUST have full access and visibility.

### API Calls
- Always use `apiFetch()` from `src/api.ts` — never raw `fetch()`
- Auth headers auto-attached from localStorage (`auth_token`, `auth_user`)
- 401 responses auto-trigger logout via `auth:expired` custom event
- `authHeaders()` helper in App.tsx provides `X-User-Id` header

### Table Views
All table-based views follow the same pattern:
1. Use `useTableView` hook for pagination, sorting, column visibility, refresh
2. Accept `TableViewProps` for controlled state from user preferences
3. Use `useCrudOperations` for save/delete with confirmation dialogs
4. Support column customization via `ColumnSelector`

### Adding a New View
1. Create `src/components/views/MyNewView.tsx` — follow existing view patterns
2. Add to `ActiveTab` union type in `src/types.ts`
3. Add lazy import in `App.tsx`
4. Add render case in the view switching block in `App.tsx`
5. Add nav item in `AdminLayout.tsx` `navItems` array (with RBAC `show` condition)
6. Add translations for tab label in all 3 locale files

### Adding a New Entity
1. Add TypeScript interface to `src/types.ts`
2. Create `src/hooks/useMyEntity.ts` — follow `useClients.ts` pattern
3. Add fetch function in `useAppData.ts` via `useFetcher`
4. Wire into `App.tsx` (domain hook + setter in useAppData)
5. Create view component and wire into navigation

### Translation Pattern
```typescript
const { t } = useLanguage();
// Simple key lookup
t('tabDashboard')
// With interpolation
t('showingResults', { count: 10, total: 50 })
```
Adding translations:
1. Add key to `TranslationKeys` interface in `src/i18n/translations.ts`
2. Add values in all 3 locale files: `en.ts`, `sr-Latn.ts`, `sr-Cyrl.ts`

### Icon Pattern
All MUI icons are imported through `src/components/icons.ts` barrel file as individual named re-exports for optimal tree-shaking. Never import directly from `@mui/icons-material`.

### User Preferences
Server-persisted per-user KV store:
- GET/PUT `/api/preferences` + `/api/preferences/:key`
- Used for: theme mode, language, visible columns per view, rows-per-page, sort state, entity work mode
- Managed by `useAppData` → `updatePreference(key, value)` with optimistic updates

---

## Build & Dev

```bash
npm run dev        # Dev server at :3000, proxies /api → :5000
npm run build      # TypeScript check + Vite production build
npm run preview    # Serve production build locally
npm run lint       # TypeScript check + oxlint
npm run deploy     # Build + deploy to GitHub Pages (gh-pages)
```

### Build-Time Injected Globals
| Global | Source | Purpose |
|---|---|---|
| `__APP_VERSION__` | Git tag → `package.json` → `1.0.0` | SemVer displayed in sidebar |
| `__COMMIT_HASH__` | `git rev-parse --short HEAD` | Commit SHA in settings |
| `__BUILD_TIME__` | `new Date().toISOString()` | Build timestamp |

### Manual Chunks (Vite)
| Chunk | Contents |
|---|---|
| `vendor-react` | `react` + `react-dom` |
| `vendor-mui` | `@mui/material` + `@emotion/*` |
| `vendor-mui-icons` | `@mui/icons-material` |
| `vendor-mui-charts` | `@mui/x-charts` |

---

## Gotchas & Important Notes

1. **No router** — Navigation is via `activeTab` state. Deep linking / back button not supported.
2. **`fetchAllData` re-fetches everything** — Currently fires 10 parallel requests. No per-entity targeted refresh yet.
3. **Session expiry is client-side** — `auth_session_expires_at` in localStorage. Server JWT also expires (9h default).
4. **Auth polling pauses on hidden tabs** — Uses Page Visibility API to avoid background requests.
5. **Invoice metadata in notes** — Invoice type and parent link are embedded as `<!--meta:{...}-->` HTML comments in the `notes` field when server doesn't support explicit fields.
6. **Admin role simulation** — `admin_role_view` localStorage key lets admins test as any role. Only available for actual Administrator accounts.
7. **Default language is Serbian Latin** — Not English. This is intentional for the target user base.
8. **Icons must use barrel file** — Import from `./icons` or `../icons`, never from `@mui/icons-material` directly.
9. **`App.tsx` is the God component** — ~640 lines. Orchestrates everything. Future refactoring should extract routing and provider wiring.
10. **Scroll lock disabled globally** — All MUI modals, drawers, menus, selects have `disableScrollLock: true` to prevent body scroll issues.
