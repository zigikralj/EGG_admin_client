# AI Quick Context — Ekos Project Tracker Client

> **Purpose:** This file gives AI assistants fast orientation to the client-side codebase.
> Read this file FIRST when working on the client project.

---

## What Is This Project?

A **React 19 + TypeScript + MUI v9 SPA** for managing environmental services projects (waste management, permits, reminders, invoicing) for Ekos Green Group, a Serbian environmental company. Built with **Vite 8** and deployed to GitHub Pages or custom domain.

The client is organized into two primary applications sharing a common authenticated shell (`AdminLayout`):
1. **Project Tracker** (`/project-tracker/*`): Operational dashboards, real-time activity updates, Approaching Invoices, Active Reminders, Waste Disposal tracking, and visual analytics.
2. **Data Management** (`/data-management/*`): Full-featured administration and CRUD tables for Projects, Clients, Permits, Users, Roles, Services, Provided Services, Categories, Invoices, Reminders, Activity Audit Logs, and Analytics.

The client communicates with a separate Express 5 REST API server (see `../server/`).

---

## Quick File Map

### Entry & Boot
| File | Purpose |
|---|---|
| `index.html` | HTML shell — mounts `#root` |
| `src/main.tsx` | ReactDOM entry. Wraps `<App />` in StrictMode, QueryClientProvider, and `<BrowserRouter>` with dynamic basename (`getRouterBasename()`). |
| `src/App.tsx` | **Lightweight root orchestrator** (~65 lines). Wraps providers (`LanguageProvider`, `AuthProvider`, `NotificationProvider`, `LoadingProvider`, `CustomThemeProvider`, `ProjectModalProvider`), renders `AdminLayout`, `AppRoutes`, `LoadingMask`, and `VersionUpdatePrompt`. |
| `src/routes/AppRoutes.tsx` | **Centralized routing** with React 19 / Vite lazy-loaded chunks for each of the 19 dedicated pages. |
| `vite.config.ts` | Vite + React plugin, dev proxy `/api` → `:5000`, manual chunk splitting, version.json generation, SPA 404 fallback, and dynamic base path resolution. |
| `playwright.config.ts` | Playwright E2E configuration — base URL `http://localhost:3000`, webServer auto-start (`npm run dev`), auth state fixture (`playwright/.auth/user.json`). |
| `e2e/` | Playwright E2E test suites (`auth/`, `tracker/`, `management/`, `auth.setup.ts`). |

### Type Definitions (`src/types/`)
Modularized domain types defined in `src/types/` (re-exported via `src/types/index.ts`):
| File | Types |
|---|---|
| `common.types.ts` | `ActiveTab`, `DashboardSubTab`, `ProvidedServicesSubTab`, `CustomFieldDefinition`, `SortState`, `TableViewProps`, `AppFetchers`, `SaveResult` |
| `auth.types.ts` | `UserRole`, `User`, `Role` |
| `project.types.ts` | `Project`, `ProjectStatus`, `ProjectNote` |
| `client.types.ts` | `Client`, `CompanyInfo` |
| `permit.types.ts` | `Permit`, `WasteCatalog`, `PermitStatusResult` |
| `invoice.types.ts` | `Invoice`, `InvoiceStatus`, `InvoiceCurrency`, `InvoiceType`, `InvoiceItem` |
| `reminder.types.ts` | `Reminder`, `ReminderStatus` |
| `service.types.ts` | `Service`, `Category`, `ProvidedService` |
| `activity.types.ts` | `AppNotification`, `ActivityLog`, `ActivityAnalytics` |
| `globals.d.ts` | `__APP_VERSION__`, `__COMMIT_HASH__`, `__BUILD_TIME__` declarations |

### API Layer
| File | Purpose |
|---|---|
| `src/api.ts` | `getApiUrl(path)` — resolves base URL. `apiFetch(input, init)` — wrapper around `fetch()` that auto-attaches JWT `Authorization` header + `X-User-Id` from localStorage, and dispatches `auth:expired` custom event on 401 (triggers auto-logout). |

### Context Providers (`src/context/`)
| File | Provider | Hook | Key Responsibilities |
|---|---|---|---|
| `AuthContext.tsx` | `AuthProvider` | `useAuth()` | Login/register/logout, JWT token & session expiry, dynamic role resolution, granular permissions (`hasPermission()`, `canManage*`), resource-level scoping (`isRestrictedToOwn()`), `canEditUser()`, `canEditProject()`, periodic auth polling with Page Visibility API. |
| `ProjectModalContext.tsx` | `ProjectModalProvider` | `useProjectModal()` | Global modal orchestration for Projects (`openViewProject`, `openEditProject`, `openNewProject`, `openProjectById`). Mounts lazy-loaded `<ProjectViewModal />` and `<ProjectModal />` without prop-drilling through `App.tsx`. |
| `LanguageContext.tsx` | `LanguageProvider` | `useLanguage()` | `t(key, params)` translation, `getServiceLabel()`, `getResponsibleLabel()` (gender-aware), `getErrorMessage()` — lazy-loads locale dictionaries. Default language: `sr-Latn`. |
| `ThemeContext.tsx` | `CustomThemeProvider` | `useThemeContext()` | Light/dark/system theme mode, system preference listener via `matchMedia`, syncs `data-theme` attribute on `<html>`. |
| `NotificationContext.tsx` | `NotificationProvider` | `useNotifications()` | Fetches, polls (25s intervals with Page Visibility pausing), and manages @mention notifications. Optimistic UI for mark-read/delete/clear-all. |
| `LoadingContext.tsx` | `LoadingProvider` | `useLoading()` | Global async loading spinner state. |

### Constants (`src/constants/`)
| File | Purpose |
|---|---|
| `apiRoutes.ts` | Centralized API endpoint routes and parameterized URL generators (`API_ROUTES`). |
| `pageRoutes.ts` | Centralized client navigation paths (`PAGE_ROUTES`). |

### Custom Hooks (`src/hooks/`)
| Hook | Purpose |
|---|---|
| `useTableView.ts` | **Shared table infrastructure.** Column visibility, pagination (rows-per-page + options), sorting (field + direction), refresh with spinner, error dialogs. Syncs local state ↔ controlled props from user preferences. |
| `useProjectForm.ts` | Complex form state for project create/edit modal — manages name, client, responsible, type, dates, progress, notes, nested reminder/invoice sub-forms. |
| `useInvoiceFormState.ts` | Form state for invoice create/edit — new/edit modes, line items, parent linking, currency, status. |
| `useVersionCheck.ts` | Polls `/version.json` to detect new deployments, shows update banner. Uses Page Visibility API. |
| `useRoleLabels.ts` | Maps `UserRole` strings to translated labels. |
| `useStatusUpdate.ts` | Generic status-change helper (PATCH to arbitrary endpoint). |
| `useLinkedListOptions.ts` | Handles dynamic hierarchical options fetching and dependency resolution for custom fields. |
| `useActivityTracker.ts` | Non-intrusive batched page activity tracker with idle detection, session timeouts, multi-tab sync, and short-session purge. |

### React Query Hooks (`src/queries/`)
Modularized domain query modules re-exported through barrel `src/queries/index.ts`:
| File | Hooks |
|---|---|
| `projects.queries.ts` | `useProjectsQuery`, `usePaginatedProjectsQuery`, `useInfiniteProjectsQuery`, `useProjectDetailsQuery`, `useProjectUpdatesQuery`, `useProjectsMutations` |
| `clients.queries.ts` | `useClientsQuery`, `useClientsSummaryQuery`, `usePaginatedClientsQuery`, `useClientsMutations` |
| `permits.queries.ts` | `usePermitsQuery`, `usePaginatedPermitsQuery`, `useWasteCatalogQuery`, `usePermitsMutations` |
| `invoices.queries.ts` | `useInvoicesQuery`, `usePaginatedInvoicesQuery`, `useInvoicesMutations` |
| `reminders.queries.ts` | `useRemindersQuery`, `usePaginatedRemindersQuery`, `useRemindersMutations` |
| `services.queries.ts` | `useServicesQuery`, `useCategoriesQuery`, `useServicesMutations`, `useCategoriesMutations` |
| `providedServices.queries.ts` | `useProvidedServicesQuery`, `usePaginatedProvidedServicesQuery`, `useProvidedServicesMutations` |
| `users.queries.ts` | `useUsersQuery`, `usePaginatedUsersQuery`, `useRolesQuery`, `useUsersMutations`, `fetchMentionUsers` |
| `activity.queries.ts` | `useActivityLogsQuery`, `useActivityAnalyticsQuery`, `useActivityLogsMutations` |
| `history.queries.ts` | `useEntityTimelineQuery`, `useVersionDiffQuery`, `useRestoreVersionMutation` |
| `preferences.queries.ts` | `usePreferencesQuery`, `usePreferencesMutations`, `useTablePreferences(tableKey)` |
| `queryUtils.ts` | `useAuthHeaders`, `buildPaginationQueryParams`, `useGenericMutations` |
| `autocomplete.queries.ts` | Autocomplete caching queries |

---

### App 1: Project Tracker (`src/pages/project-tracker/`)
| Path | Route Constant | Page Component | Notes |
|---|---|---|---|
| `/project-tracker/projects` | `PROJECT_TRACKER_PROJECTS` | `TrackerProjectsPage.tsx` | Infinite scroll project cards, quick filters (`my`, `active`, `missing_invoice`, `stale`, `overdue`), search. |
| `/project-tracker/updates` | `PROJECT_TRACKER_UPDATES` | `TrackerUpdatesPage.tsx` | Real-time audit stream for project changes, note revisions, diff trigger. |
| `/project-tracker/reminders` | `PROJECT_TRACKER_REMINDERS` | `TrackerRemindersPage.tsx` | Dedicated page for approaching/overdue reminders. |
| `/project-tracker/invoices` | `PROJECT_TRACKER_INVOICES` | `TrackerInvoicesPage.tsx` | Dedicated page for approaching invoices with quick status actions. |
| `/project-tracker/waste-disposal` | `PROJECT_TRACKER_WASTE` | `TrackerWasteDisposalPage.tsx` | Dedicated page for waste disposal service deliveries. |
| `/project-tracker/statistic` | `PROJECT_TRACKER_STATISTICS` | `TrackerProjectsStatsPage.tsx` | Dedicated page for project KPIs & distribution charts. |
| `/project-tracker/statistic-waste-disposal` | `PROJECT_TRACKER_WASTE_STATISTICS` | `TrackerWasteStatsPage.tsx` | Dedicated page for waste disposal statistics & quantities. |

### App 2: Data Management (`src/pages/data-management/`)
| Path | Route Constant | Page Component | Notes |
|---|---|---|---|
| `/data-management/projects` | `PROJECTS` | `ProjectsPage.tsx` | Projects administration table, column selector, history timeline. |
| `/data-management/clients` | `CLIENTS` | `ClientsPage.tsx` | Clients administration table with permit linking. |
| `/data-management/permits` | `PERMITS` | `PermitsPage.tsx` | Environmental permits table, status badges, reminders. |
| `/data-management/users` | `USERS` | `UsersPage.tsx` | Users administration, approve/reject, force logout. |
| `/data-management/roles` | `ROLES` | `RolesPage.tsx` | Granular permissions matrix management. |
| `/data-management/services` | `SERVICES` | `ServicesPage.tsx` | Services catalog with custom data model schema editor. |
| `/data-management/provided-services` | `PROVIDED_SERVICES` | `ProvidedServicesPage.tsx` | Service delivery logs table. |
| `/data-management/categories` | `CATEGORIES` | `CategoriesPage.tsx` | Service categories CRUD table. |
| `/data-management/invoices` | `INVOICES` | `InvoicesPage.tsx` | Invoices lifecycle, parent/child links, line items. |
| `/data-management/reminders` | `REMINDERS` | `RemindersPage.tsx` | Reminders administration table with entity links. |
| `/data-management/activity-logs` | `ACTIVITY_LOGS` | `ActivityLogsPage.tsx` | Audit log viewer with diffs. |
| `/data-management/activity-logs/analytics` | `ACTIVITY_ANALYTICS` | `ActivityAnalyticsPage.tsx` | Activity metrics, user breakdowns, heatmap, and insights. |

---

## Component Organization by Domain (`src/components/`)

- `common/`: Domain-agnostic components (`ColumnSelector`, `DateRangeFilter`, `TableSearchInput`, `TableQuickFilters`, `DashboardPanelSkeleton`, `WasteCatalogAutocomplete`).
- `common/dialogs/`: Generic dialogs (`ConfirmDialog`, `ConfirmDeleteDialog`, `ErrorDialog`, `VersionUpdatePrompt`).
- `common/tiptap/`: Rich text TipTap editor, toolbar, and mentions.
- `layout/`: App shell (`AdminLayout`, `AppHeader`, `Sidebar`, `SettingsDialog`, `UserProfileDialog`, `NotificationsMenu`).
- `project/`: Project cards, `ProjectModal`, `ProjectViewModal`, sections, sliders, notes.
- `client/`: Client components including extracted `ClientModal`.
- `permit/`: Permit components, `PermitModal`, status badges, table, reminder dialogs.
- `invoice/`: Invoice modal, line items, form fields, status chips, row detail.
- `reminder/`: Reminder components including `ReminderModal`.
- `service/`: Service components, `ServiceModal`, `CustomDataModelModal`.
- `providedService/`: Provided service components including `ProvidedServiceModal`.
- `user/`: User management components including `UserModal`.
- `role/`: `RoleModal` and permission matrix editor.
- `company/`: `CompanyInfoModal`.
- `statistics/`: Visual charts (`ProjectsStatistics`, `WasteDisposalStatistics`).
- `history/`: Change timeline and diff review (`HistoryTimelineModal`, `NoteHistoryDiffModal`, `HistoryDiffView`).

---

## Developer Recipes

### How to Add a New Page to Project Tracker
1. Create `src/pages/project-tracker/TrackerMyNewPage.tsx`.
2. Export it from `src/pages/project-tracker/index.ts`.
3. Add the route constant in `src/constants/pageRoutes.ts` (e.g. `PROJECT_TRACKER_MY_NEW: '/project-tracker/my-new'`).
4. Add the route in `src/routes/AppRoutes.tsx`:
   ```tsx
   const TrackerMyNewPage = React.lazy(() => import('../pages/project-tracker/TrackerMyNewPage'));
   // Inside <Routes>:
   <Route path={PAGE_ROUTES.PROJECT_TRACKER_MY_NEW} element={<TrackerMyNewPage />} />
   ```
5. Add navigation link in `src/components/layout/Sidebar.tsx` under the Project Tracker navigation items.
6. Add unit test in `src/pages/project-tracker/TrackerMyNewPage.test.tsx`.

### How to Add a New Page to Data Management
1. Create `src/pages/data-management/MyNewPage.tsx`. Use `useTablePreferences('my_new')` for reactive preferences.
2. Export it from `src/pages/data-management/index.ts`.
3. Add route constant in `src/constants/pageRoutes.ts` (e.g. `MY_NEW: '/data-management/my-new'`).
4. Add route in `src/routes/AppRoutes.tsx`:
   ```tsx
   const MyNewPage = React.lazy(() => import('../pages/data-management/MyNewPage'));
   // Inside <Routes>:
   <Route path={PAGE_ROUTES.MY_NEW} element={<MyNewPage />} />
   ```
5. Add entry in `AdminLayout.tsx` `navItems` array with RBAC check (`show: hasPermission('myNew', 'view')`).
6. Add unit test in `src/pages/data-management/MyNewPage.test.tsx`.

### How to Add or Extend a Domain Query and Domain Type
1. Define TypeScript interfaces in `src/types/<domain>.types.ts` and re-export from `src/types/index.ts`.
2. Create query and mutation hooks in `src/queries/<domain>.queries.ts` and re-export from `src/queries/index.ts`.
3. Use the hook directly in your page or component.

---

## Key Rules & Conventions

### RBAC Pattern & Developer Admin Rule
> [!IMPORTANT]
> **CRITICAL RULE — Developer Administrator Visibility:**
> The developer operates using an Administrator account. Administrator level **MUST see everything and have full access to all features**.
> **NEVER hide any options, switches, menus, or features from Administrator.** If something is available to Manager, Accountant, or User, Administrator MUST have full access and visibility.

### Table Preferences
Instead of prop-drilling preference states from `App.tsx`, pages consume `useTablePreferences(tableKey)`:
```typescript
const tablePrefs = useTablePreferences('clients');
const visibleColumns = props.visibleColumns ?? tablePrefs.visibleColumns ?? DEFAULT_COLUMNS;
```
This enables pages to work standalone with zero required props while maintaining 100% testability.

### Project Modals
Any page can trigger view/edit/creation of projects without prop-drilling:
```typescript
const { openViewProject, openEditProject, openNewProject, openProjectById } = useProjectModal();
```

### Verification & Testing
1. **NO BROWSER LOGIN VERIFICATION (MANUAL):** NEVER open the browser or use browser subagents to attempt logging in manually. The AI assistant does NOT have valid credentials for interactive browser login.
2. **Automated Verification:** Rely strictly on:
   - TypeScript compilation: `npm run typecheck` (`tsc -b`)
   - Linter: `npm run lint` (`tsc -b && oxlint`)
   - Vitest unit tests: `npm test` (`npx vitest run --maxWorkers=3`)
   - Build verification: `npm run build` (`tsc -b && vite build`)
   - Playwright E2E: `npm run test:e2e`
