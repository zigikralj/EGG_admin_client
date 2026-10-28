# API Reference — Ekos Project Tracker Client

> Complete reference of all REST API endpoints consumed by the client application.

---

## Base URL

Configured via environment variable:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

In development, Vite proxies `/api/*` to `http://localhost:5000`.

All requests are made through [`apiFetch()`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/api.ts), which automatically:
- Prepends the base URL
- Attaches `Authorization: Bearer <token>` header from localStorage
- Attaches `X-User-Id` header from stored user
- Dispatches `auth:expired` custom event on 401 responses (auto-logout)

---

## Authentication

### `POST /api/auth/login`

Login with credentials.

**Request Body:**
```json
{
  "emailOrName": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "Administrator | Manager | User | Accountant",
    "phone": "string | null",
    "avatarUrl": "string | null",
    "gender": "Male | Female | Other | null",
    "isApproved": true,
    "status": "ACTIVE"
  },
  "token": "jwt-string",
  "expiresIn": 32400
}
```

**Error Response (401):**
```json
{
  "error": "INVALID_CREDENTIALS | ACCOUNT_PENDING | ACCOUNT_BLOCKED",
  "message": "string"
}
```

**Used by:** [`AuthContext.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/context/AuthContext.tsx)

---

### `POST /api/auth/register`

Register a new user (requires admin approval).

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "password": "string"
}
```

**Success Response (201):**
```json
{
  "message": "Registration submitted successfully!"
}
```

**Used by:** [`AuthContext.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/context/AuthContext.tsx)

---

### `GET /api/auth/me`

Check current auth status (periodic polling for blocked user detection).

**Headers:** `X-User-Id: uuid`

**Success Response (200):** User object  
**Error Response (403):** `{ "error": "ACCOUNT_BLOCKED" }` — triggers logout

**Used by:** [`AuthContext.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/context/AuthContext.tsx) (30s polling interval, paused on hidden tab)

---

## Projects

### `GET /api/projects`

List all projects. Supports search, status, and delta sync.
Returns lightweight rows containing `notesPreview` (plain text up to 300 characters) for high list performance.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by name, client, responsible (case-insensitive contains) |
| `done` | boolean | Filter active vs completed projects |
| `clientId` | string | Filter projects for a specific client |
| `since` | string | ISO timestamp for incremental delta synchronization |
| `page` / `limit` | number | Optional pagination parameters |

**Response (standard):** `Project[]`
**Response (delta):** `DeltaEnvelope<Project>` `{ delta: true, items: Project[], deletedIds: string[], syncedAt: string }`

**Used by:** `useProjectsQuery` in [`src/queries/index.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/002_EkosGreenGroup/project_tracker/client/src/queries/index.ts) via `fetchWithDeltaSync`

---

### `GET /api/projects/updates`

Retrieve real-time project updates and audit activity stream across the organization.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `limit` | number | Max events to return (default: 50) |
| `offset` | number | Pagination offset |
| `projectId`| string | Optional filter for a specific project |

**Response (200):** Array of project update items with author, target entity, timestamp, and diff summary.

**Used by:** `useProjectUpdatesQuery` / `ProjectUpdatesPanel.tsx`

---

### `GET /api/projects/:id`

Get complete details of a single project, including full rich-text HTML `notes`.

**Response (200):** `Project` object.

**Used by:** `ProjectViewModal.tsx`, `useProjectsQuery`

---

### `GET /api/projects/:id/note`

Fetch current rich-text note content directly from `ProjectNote`.

**Response (200):** `{ projectId: string, content: string, version: number, updatedAt: string }`

---

### `GET /api/projects/:id/note/history`

Get version revision timeline for a project's notes.

**Response (200):** Array of `ProjectNoteVersion` items `{ version, kind, charDelta, authorName, createdAt }`

**Used by:** `NoteHistoryDiffModal.tsx`

---

### `GET /api/projects/:id/note/diff`

Get unified diff or field diff between two note versions or dates.

**Query Parameters:** `?from=1&to=3` OR `?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`

**Response (200):** `{ fromVersion, toVersion, diff, addedCount, removedCount }`

**Used by:** `NoteHistoryDiffModal.tsx`

---

### `POST /api/projects/:id/note/restore/:v`

Restore a project note to historical version `:v`.

**Response (200):** `{ success: true, version: number, content: string }`

**Used by:** `NoteHistoryDiffModal.tsx`

---

### `POST /api/projects`

Create a new project.

**Request Body:** `Partial<Project>` (excluding `id`)

**Response (201):** Created `Project` object with `id`

**Used by:** `useProjectMutations` in `src/queries/index.ts`

---

### `PUT /api/projects/:id`

Update an existing project. Automatically records delta revisions in `ProjectNote` and `EntityVersion`.

**Request Body:** Full or partial `Project` object

**Response (200):** Updated `Project`

**Used by:** `useProjectMutations` in `src/queries/index.ts`

---

### `DELETE /api/projects/:id`

Delete a project. Creates an `EntityVersion` tombstone (`op: 'D'`) to communicate deletion to delta sync clients.

**Response (200):** `{ "message": "Project deleted successfully" }`

**Used by:** `useProjectMutations` in `src/queries/index.ts`

---

### `PATCH /api/projects/:id/toggle-done`

Toggle project completion status.

**Response (200):** Updated `Project`

**Used by:** `useProjectMutations` in `src/queries/index.ts`

---

### `GET /api/projects/stats`

Dashboard aggregate statistics (cached in server memory).

**Response:**
```json
{
  "active": 10,
  "done": 25,
  "stale": 3,
  "monitor": 5,
  "clientsCount": 40,
  "usersCount": 8,
  "servicesCount": 15,
  "categoriesCount": 6,
  "invoicesCount": 100,
  "providedServicesCount": 200,
  "permitsCount": 30
}
```

**Used by:** `useDashboardStatsQuery` in `src/queries/index.ts`

---

## Clients

### `GET /api/clients`

List all clients.

**Response:** `Client[]` (with nested `permit`, `extraData`, `projects`, `invoices`)

---

### `POST /api/clients`

Create a new client.

**Request Body:** `Partial<Client>`

---

### `PUT /api/clients/:id`

Update a client.

---

### `DELETE /api/clients/:id`

Delete a client.

**Used by:** [`useClients.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useClients.ts)

---

## Users

### `GET /api/users`

List all users.

**Response:** `User[]` (password field excluded)

---

### `POST /api/users`

Create a new user (admin).

---

### `PUT /api/users/:id`

Update a user.

---

### `DELETE /api/users/:id`

Delete a user.

---

### `PATCH /api/users/:id/approve`

Approve a pending user registration.

---

### `PATCH /api/users/:id/reject`

Reject a pending user registration.

---

### `POST /api/users/:id/force-logout`

Force-logout a user (invalidates their session server-side).

---

## Roles

Endpoints for managing dynamic system roles and granular permissions.

### `GET /api/roles`

List all configured roles with user counts.

**Response:** `Role[]` (includes `name`, `description`, `isSystemAdmin`, `permissions`, and `_count.users`)

**Used by:** [`AuthContext.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/context/AuthContext.tsx), `RolesPage.tsx`

---

### `POST /api/roles`

Create a new dynamic role. Requires role create permission or System Administrator.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "isSystemAdmin": false,
  "permissions": {
    "projects": ["view", "create", "edit", "delete"],
    "projects_onlyOwn": true
  }
}
```

---

### `PUT /api/roles/:name`

Update a role's description, system admin status, or permissions matrix.

---

### `DELETE /api/roles/:name`

Delete a role. Default `Administrator` cannot be deleted, and roles currently assigned to users cannot be deleted.

---

## Services

### `GET /api/services`

List all service type definitions.

**Response:** `Service[]` (includes `customDataModel` for custom field definitions)

---

### `POST /api/services`

Create a service definition.

---

### `PUT /api/services/:id`

Update a service definition.

---

### `DELETE /api/services/:id`

Delete a service definition.

**Used by:** [`useServices.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useServices.ts)

---

## Provided Services

### `GET /api/provided-services`

List all provided service records.

**Response:** `ProvidedService[]` (with nested `service`, `client`, `project`, `invoice`)

---

### `POST /api/provided-services`

Create a service delivery record.

---

### `PUT /api/provided-services/:id`

Update a service record.

---

### `DELETE /api/provided-services/:id`

Delete a service record.

**Used by:** [`useProvidedServices.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useProvidedServices.ts)

---

## Categories

### `GET /api/categories`

List all categories.

**Response:** `Category[]`

---

### `POST /api/categories` / `PUT /api/categories/:id` / `DELETE /api/categories/:id`

Standard CRUD.

**Used by:** [`useCategories.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useCategories.ts)

---

## Reminders

### `GET /api/reminders`

List all reminders.

**Response:** `Reminder[]` (with nested `permit` if linked)

---

### `POST /api/reminders` / `PUT /api/reminders/:id` / `DELETE /api/reminders/:id`

Standard CRUD.

---

### `PATCH /api/reminders/:id/status`

Update reminder status.

**Request Body:**
```json
{ "status": "Pending | In Progress | Completed" }
```

**Used by:** [`useReminders.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useReminders.ts)

---

## Invoices

### `GET /api/invoices`

List all invoices.

**Response:** `Invoice[]` (with nested `items`, `client`, `project`, `parentInvoice`, `childInvoices`)

---

### `POST /api/invoices`

Create an invoice with line items.

**Request Body:**
```json
{
  "invoiceNumber": "string",
  "invoiceType": "Standard | Advance | Final | Partial",
  "parentInvoiceId": "uuid | null",
  "dateCreated": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "clientId": "uuid",
  "projectId": "uuid | null",
  "status": "Draft | Sent | Paid | Overdue | Cancelled",
  "currency": "RSD | €",
  "notes": "string",
  "items": [
    {
      "description": "string",
      "quantity": 1,
      "unitPrice": 100.00,
      "currency": "RSD"
    }
  ]
}
```

---

### `PUT /api/invoices/:id`

Update an invoice. **Note:** `items` array replaces all existing items (delete + re-create in transaction).

---

### `DELETE /api/invoices/:id`

Delete an invoice.

---

### `PATCH /api/invoices/:id/status`

Update invoice status only.

**Request Body:**
```json
{
  "status": "Draft | Sent | Paid | Overdue | Cancelled",
  "paymentDate": "YYYY-MM-DD (optional, set when status=Paid)"
}
```

**Used by:** [`useInvoices.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useInvoices.ts)

---

## Permits

### `GET /api/permits`

List all permits.

**Response:** `Permit[]` (with nested `client`, `clients`, `permitWastes`, `wasteCatalogs`, `reminders`)

---

### `POST /api/permits`

Create a permit with waste catalog associations and permit type classifications.

**Request Body:**
```json
{
  "permitNumber": "string",
  "permitTypes": ["Sakupljanje", "Transport", "Skladistenje", "Tretman", "Odlaganje"],
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "clientId": "uuid | null",
  "notes": "string",
  "wasteCatalogIds": ["uuid", "uuid"]
}
```

---

### `PUT /api/permits/:id` / `DELETE /api/permits/:id`

Standard CRUD. PUT updates waste catalog associations and permit types.

**Used by:** `usePermitsQuery`, `usePermitMutations` ([`src/queries/index.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/queries/index.ts))

---

## Waste Catalog

### `GET /api/waste-catalog`

List Serbian waste catalog entries. Auto-seeds ~50 entries on first call if empty.

**Response:** `WasteCatalog[]` or paginated `WasteCatalogResponse`:
```json
{
  "items": [...],
  "total": 850,
  "page": 1,
  "limit": 50,
  "hasMore": true
}
```

**Used by:** [`useAppData.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useAppData.ts)

---

## Notifications

### `GET /api/notifications`

Fetch user's notifications (from @mentions).

**Headers:** `X-User-Id: uuid`

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "MENTION",
      "title": "string",
      "message": "string",
      "read": false,
      "projectId": "uuid | null",
      "authorId": "uuid | null",
      "authorName": "string | null",
      "createdAt": "ISO timestamp",
      "project": { "id": "uuid", "name": "string" }
    }
  ],
  "unreadCount": 3
}
```

---

### `PATCH /api/notifications/:id/read`

Mark a single notification as read.

---

### `PATCH /api/notifications/mark-all-read`

Mark all notifications as read.

---

### `DELETE /api/notifications/:id`

Delete a single notification.

---

### `DELETE /api/notifications/clear-all`

Delete all notifications for the user.

**Used by:** [`NotificationContext.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/context/NotificationContext.tsx) (25s polling)

---

## Company Info

### `GET /api/company-info`

Get the singleton company record.

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "legalName": "string",
  "registrationNumber": "string",
  "municipality": "string",
  "city": "string",
  "streetAddress": "string",
  "postalCode": "string",
  "postOffice": "string",
  "email": "string",
  "taxId": "string",
  "activityCode": "string",
  "bankAccounts": ["string"]
}
```

---

### `PUT /api/company-info`

Update company information.

**Used by:** [`CompanyInfoModal.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/CompanyInfoModal.tsx)

---

## User Preferences

### `GET /api/preferences`

Get all preferences for the authenticated user.

**Response:** `Record<string, any>` — flat key-value object.

Known preference keys:
| Key | Type | Description |
|---|---|---|
| `theme_mode` | `'light' \| 'dark' \| 'system'` | Theme preference |
| `language` | `'en' \| 'sr-Latn' \| 'sr-Cyrl'` | Language preference |
| `work_on_entities` | `boolean` | Manager entity work mode |
| `projects_columns` | `string[]` | Visible columns for projects table |
| `clients_columns` | `string[]` | Visible columns for clients table |
| `*_rows_per_page` | `number` | Rows per page for various tables |
| `*_sort` | `SortState` | Sort configuration for various tables |

---

### `PUT /api/preferences/:key`

Update a single preference.

**Request Body:**
```json
{ "value": "any" }
```

**Used by:** [`usePreferencesMutations`](file:///Users/nemanja.stanojevic/Documents/zigicode/002_EkosGreenGroup/project_tracker/client/src/queries/index.ts) — with optimistic UI updates

---

## Activity Logs & Analytics

> **Base Path:** `/api/activity-logs` (centralized in `src/constants/apiRoutes.ts`)

### `GET /api/activity-logs/status`
Check if activity logging is enabled globally.
- **Roles:** Any authenticated user.
- **Returns:** `{ enabled: boolean, retentionDays: number }`

### `PATCH /api/activity-logs/status`
Toggle activity logging globally or adjust retention.
- **Roles:** Administrator
- **Body:** `{ enabled?: boolean, retentionDays?: number }`
- **Returns:** `{ enabled: boolean, retentionDays: number }`

### `GET /api/activity-logs`
Fetch paginated list of activity logs.
- **Roles:** Administrator
- **Query Params:**
  - `userId` (optional): Filter by user UUID
  - `sessionId` (optional): Filter by session ID
  - `from` (optional): ISO date string to fetch logs after
  - `limit` (optional): Max number of logs (default: 1000, max: 5000)
  - `includeDetails` (optional): Set to 'true' to load the full diff payload
- **Returns:** Array of `ActivityLog` objects.

### `GET /api/activity-logs/analytics`
Compute comprehensive activity metrics, usage trends, and KPI statistics across the organization.
- **Roles:** Administrator
- **Query Params:**
  - `from` (optional): ISO date string start range
  - `to` (optional): ISO date string end range
  - `tz` (optional): User IANA timezone (e.g. `'Europe/Belgrade'`, default `'UTC'`)
  - `granularity` (optional): `'day' | 'week' | 'month'` (auto-calculated if omitted)
  - `userIds` (optional): Comma-separated user UUIDs
  - `roles` (optional): Comma-separated role names
  - `excludeAdminPages` (optional): `'false'` to include administrative routes (default: `'true'`)
  - `compare` (optional): `'false'` to skip previous period delta calculations (default: `'true'`)
- **Returns:** `{ kpis, timeline, topPages, actionsByEntity, userUsage, userPageBreakdown, heatmap, sessionDurationDistribution, transitions, featureAdoption, editedFields }`
- **Used by:** [`ActivityAnalyticsPage.tsx`](file:///Users/nemanja.stanojevic/Documents/zigicode/002_EkosGreenGroup/project_tracker/client/src/pages/data-management/ActivityAnalyticsPage.tsx)

### `GET /api/activity-logs/:id`
Fetch a single activity log with its full details payload (lazy loaded for diff viewing).
- **Roles:** Administrator
- **Returns:** `ActivityLog` object.

### `POST /api/activity-logs`
Ingest client activity events (page navigation, session duration, user actions). Buffered in memory on the server.
- **Roles:** Any authenticated user
- **Body:** `ActivityLog | ActivityLog[]`
- **Returns:** HTTP 202 Accepted.
- **Used by:** [`useActivityTracker.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/002_EkosGreenGroup/project_tracker/client/src/hooks/useActivityTracker.ts)

### `DELETE /api/activity-logs/clear-all`
Clear all activity logs from the database. Invalidates analytics cache.
- **Roles:** Administrator
- **Returns:** `{ count: number }`

### `POST /api/activity-logs/bulk-delete`
Delete selected activity logs by ID array. Invalidates analytics cache.
- **Roles:** Administrator
- **Body:** `{ ids: string[] }`
- **Returns:** `{ count: number }`

### `DELETE /api/activity-logs/session/:sessionId`
Delete all logs matching a specific session ID. Invalidates analytics cache.
- **Roles:** Administrator
- **Returns:** `{ count: number }`

### `DELETE /api/activity-logs/:id`
Delete a specific activity log. Invalidates analytics cache.
- **Roles:** Administrator
- **Returns:** `{ success: boolean }`

---

## History & Data Versioning (`/api/history`)

Comprehensive entity versioning and point-in-time diff inspection.

### `GET /api/history/:entityType/:id`
Fetch historical version timeline for an entity.
- **Params:** `entityType` (e.g. `Project`, `Invoice`, `Client`), `id` (entity UUID)
- **Query Params:** `?limit=50&offset=0&includeChildren=true`
- **Returns:** `{ entityType, entityId, currentVersion, versions: [...] }`
- **Used by:** `HistoryTimelineModal.tsx`, `useEntityHistoryQuery`

### `GET /api/history/:entityType/:id/diff`
Compute field diffs between two versions or date ranges.
- **Query Params:** `?from=1&to=4` OR `?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
- **Returns:** `{ entityType, entityId, fromVersion, toVersion, changes: [...], dateFrom, dateTo }`
- **Used by:** `HistoryTimelineModal.tsx`

### `GET /api/history/:entityType/:id/versions/:v`
Reconstruct full entity snapshot at version `:v`.
- **Returns:** Reconstructed entity data at historical version `:v`.

### `GET /api/history/changesets/:id`
Inspect multi-entity transaction changeset details.
- **Returns:** `ChangeSet` details with all touched entity versions.

### `POST /api/history/:entityType/:id/restore/:v`
Restore entity state to version `:v`.
- **Roles:** User with `history:restore` permission
- **Returns:** `{ success: true, restoredVersion, newVersion, entity }`
- **Used by:** `HistoryTimelineModal.tsx`

---

## Delta Synchronization Engine (`src/utils/deltaSync.ts`)

The client features transparent incremental delta synchronization built on top of TanStack React Query:

- **`fetchWithDeltaSync<T>({ url, queryKey, queryClient })`**:
  - Checks if valid cached data and a `syncedAt` timestamp exist for `queryKey`.
  - Appends `?since=<syncedAt>` to the outgoing request.
  - Receives either a raw array (initial full load) or a `DeltaEnvelope<T>` `{ delta: true, items, deletedIds, syncedAt }`.
  - Reconciles updates using `mergeDelta()`: updates modified items in-place, appends new records, and purges deleted tombstone IDs.
  - Updates the `syncedAt` map for the query key.

---

## Multi-Tier Waste Catalog Storage (`src/utils/wasteCatalogStorage.ts`)

To avoid network latency and large payload transfers for the Serbian national waste index (~1,000+ entries):

- **In-Memory Cache (Tier 1):** 0ms synchronous read access.
- **IndexedDB (`ekos_project_tracker_db`, Tier 2):** Persistent browser storage surviving page refreshes and browser restarts.
- **Cross-Tab `BroadcastChannel` (`ekos_waste_catalog_sync`):** Synchronizes additions, edits, or deletes across all open application tabs in real time.
- **Delta Sync:** Checks `syncedAt` against `/api/waste-catalog?since=...` to fetch only catalog updates and purge deleted codes.
