# API Reference — Ekos Project Tracker Client

> Complete reference of all REST API endpoints consumed by the client application.

---

## Base URL

Configured via environment variable:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

In development, Vite proxies `/api/*` to `http://localhost:5000`.

All requests are made through [`apiFetch()`](../src/api.ts), which automatically:
- Prepends the base URL
- Attaches `Authorization: Bearer <token>` header from localStorage
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

**Used by:** [`AuthContext.tsx`](../src/context/AuthContext.tsx)

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

**Used by:** [`AuthContext.tsx`](../src/context/AuthContext.tsx)

---

### `GET /api/auth/me`

Check current auth status (periodic polling for blocked user detection).

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):** User object  
**Error Response (403):** `{ "error": "ACCOUNT_BLOCKED" }` — triggers logout

**Used by:** [`AuthContext.tsx`](../src/context/AuthContext.tsx) (30s polling interval, paused on hidden tab)

---

## Projects

### `GET /api/projects`

List projects with server-side pagination, quick filters, sorting, and lightweight projections.
Returns lightweight rows containing `notesPreview` (plain text up to 300 characters) for high list performance.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `page` / `limit` | number | Server-side pagination (`PaginatedResponse<Project>`) |
| `search` | string | Filter by name, client, responsible, service (case-insensitive contains) |
| `quickFilter` | string | `'all' \| 'my' \| 'active' \| 'done' \| 'missing_invoice' \| 'stale' \| 'overdue'` |
| `fields` | string | `'summary'` returns lightweight `{ id, name, clientId, client }` projection |
| `sortBy` / `sortOrder` | string | Sort column and direction (`asc` \| `desc`) |

**Response (paginated):** `{ items: Project[], total: number, page: number, limit: number, totalPages: number }`

**Used by:** `usePaginatedProjectsQuery`, `useInfiniteProjectsQuery`, `useProjectsSummaryQuery` in [`src/queries/projects.queries.ts`](../src/queries/projects.queries.ts)

---

### `GET /api/projects/statistics`

Compute comprehensive project KPIs, status breakdowns, monthly creation/completion trends, service distribution, and responsible user workload via server-side SQL aggregation (`projectStatistics.service.ts`).

**Query Parameters:** `?from=YYYY-MM-DD&to=YYYY-MM-DD&responsibleId=uuid&serviceId=uuid`

**Used by:** `useProjectStatisticsQuery` in [`src/queries/projects.queries.ts`](../src/queries/projects.queries.ts) (`TrackerProjectsStatsPage.tsx`)

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

**Used by:** `useProjectUpdatesQuery` in [`src/queries/projects.queries.ts`](../src/queries/projects.queries.ts)

---

### `GET /api/projects/:id`

Get complete details of a single project, including full rich-text HTML `notes`.

**Response (200):** `Project` object.

**Used by:** `useProjectDetailsQuery` in [`src/queries/projects.queries.ts`](../src/queries/projects.queries.ts)

---

### `GET /api/projects/:id/note` & `PATCH /api/projects/:id/note`

Fetch or save current rich-text note content directly from `ProjectNote` without sending full project payload.

**Response (200):** `{ projectId: string, content: string, version: number, updatedAt: string }`

**Used by:** `useProjectNoteQuery`, `useProjectsMutations` in [`src/queries/projects.queries.ts`](../src/queries/projects.queries.ts)

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

### `POST /api/projects` / `PUT /api/projects/:id` / `DELETE /api/projects/:id` / `PATCH /api/projects/:id/toggle-done`

Create, update, delete, or toggle completion status of a project. Automatically records delta revisions in `ProjectNote` and `EntityVersion`.

**Used by:** `useProjectsMutations` in [`src/queries/projects.queries.ts`](../src/queries/projects.queries.ts)

---

## Clients

### `GET /api/clients` / `POST /api/clients` / `PUT /api/clients/:id` / `DELETE /api/clients/:id`

Paginated client listing (`?page=&limit=&search=&sortBy=&sortOrder=`), summary projection (`?fields=summary`), and CRUD operations.

**Used by:** [`src/queries/clients.queries.ts`](../src/queries/clients.queries.ts) (`usePaginatedClientsQuery`, `useClientsSummaryQuery`, `useClientsMutations`)

---

## Users

### `GET /api/users`

List users with server-side pagination (`?page=&limit=&search=&role=&status=`) or lightweight projections (`?fields=summary` for responsible dropdowns, `?fields=mention` for @mention / chat directory).

### `POST /api/users` / `PUT /api/users/:id` / `DELETE /api/users/:id` / `PATCH /api/users/:id/approve` / `PATCH /api/users/:id/reject` / `POST /api/users/:id/force-logout`

User management CRUD, registration approval/rejection, and session invalidation.

**Used by:** [`src/queries/users.queries.ts`](../src/queries/users.queries.ts) (`usePaginatedUsersQuery`, `useUsersSummaryQuery`, `useUsersDirectoryQuery`, `useUsersMutations`, `fetchMentionUsers`)

---

## Roles

Endpoints for managing dynamic system roles and granular permissions.

### `GET /api/roles`

List all configured roles with user counts.

**Response:** `Role[]` (includes `name`, `description`, `isSystemAdmin`, `permissions`, and `_count.users`)

**Used by:** [`AuthContext.tsx`](../src/context/AuthContext.tsx), `RolesPage.tsx`

---

### `POST /api/roles` / `PUT /api/roles/:name` / `DELETE /api/roles/:name`

Create, update, or delete a dynamic role. Default `Administrator` cannot be deleted, and roles currently assigned to users cannot be deleted.

---

## Services

### `GET /api/services` / `GET /api/services/:id` / `POST /api/services` / `PUT /api/services/:id` / `DELETE /api/services/:id`

Paginated service definitions (`?page=&limit=&search=`), single service details with `customDataModel`, and CRUD operations.

**Used by:** [`src/queries/services.queries.ts`](../src/queries/services.queries.ts) (`usePaginatedServicesQuery`, `useServiceDetailsQuery`, `useServicesMutations`)

---

## Provided Services & Waste Disposal Statistics

### `GET /api/provided-services` / `POST /api/provided-services` / `PUT /api/provided-services/:id` / `DELETE /api/provided-services/:id`

Paginated service delivery records (`?page=&limit=&search=&serviceId=&clientId=&dateFrom=&dateTo=`) with nested `service`, `client`, `project`, and `invoice`.

### `GET /api/provided-services/statistics/waste` & `GET /api/provided-services/statistics/waste/clients`

Compute server-side SQL waste disposal statistics (total weight in kg/t, delivery counts, monthly weight trends, waste code breakdowns, top clients) and filterable waste client summaries (`wasteStatistics.service.ts`).

**Used by:** [`src/queries/providedServices.queries.ts`](../src/queries/providedServices.queries.ts) (`usePaginatedProvidedServicesQuery`, `useWasteStatisticsQuery`, `useWasteDisposalClientsQuery`, `useProvidedServicesMutations`)

---

## Categories

### `GET /api/categories` / `POST /api/categories` / `PUT /api/categories/:id` / `DELETE /api/categories/:id`

Service category listing and CRUD.

**Used by:** [`src/queries/services.queries.ts`](../src/queries/services.queries.ts) (`useCategoriesQuery`, `useCategoriesMutations`)

---

## Reminders

### `GET /api/reminders` / `POST /api/reminders` / `PUT /api/reminders/:id` / `DELETE /api/reminders/:id` / `PATCH /api/reminders/:id/status`

Paginated reminders (`?page=&limit=&search=&status=&quickFilter=`) and status transitions (`Pending | In Progress | Completed`).

**Used by:** [`src/queries/reminders.queries.ts`](../src/queries/reminders.queries.ts) (`usePaginatedRemindersQuery`, `useRemindersMutations`)

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

**Used by:** [`src/queries/invoices.queries.ts`](../src/queries/invoices.queries.ts) (`usePaginatedInvoicesQuery`, `useInvoicesMutations`)

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

**Used by:** `usePermitsQuery`, `usePermitMutations` ([`src/queries/index.ts`](../src/queries/index.ts))

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

**Used by:** [`src/queries/permits.queries.ts`](../src/queries/permits.queries.ts) (`useWasteCatalogQuery`) and [`src/utils/wasteCatalogStorage.ts`](../src/utils/wasteCatalogStorage.ts)

---

## Notifications

### `GET /api/notifications`

Fetch user's notifications (from @mentions).

**Headers:** `Authorization: Bearer <token>`

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

**Used by:** [`NotificationContext.tsx`](../src/context/NotificationContext.tsx) (25s polling) and [`src/queries/systemSettings.queries.ts`](../src/queries/systemSettings.queries.ts)

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

**Used by:** [`CompanyInfoModal.tsx`](../src/components/company/CompanyInfoModal.tsx) and [`src/queries/company.queries.ts`](../src/queries/company.queries.ts)

---

## System Settings (`/api/system-settings`)

### `GET /api/system-settings` & `PUT /api/system-settings/:key`

Fetch global system settings (e.g. `waste_disposal_service_id`) or update a system setting key (Administrator only).

**Used by:** [`src/queries/systemSettings.queries.ts`](../src/queries/systemSettings.queries.ts) (`useSystemSettingsQuery`, `useWasteDisposalServiceId`, `useSystemSettingsMutations`)

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

**Used by:** [`usePreferencesMutations`](../src/queries/index.ts) — with optimistic UI updates

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
- **Used by:** [`ActivityAnalyticsPage.tsx`](../src/pages/data-management/ActivityAnalyticsPage.tsx)

### `GET /api/activity-logs/:id`
Fetch a single activity log with its full details payload (lazy loaded for diff viewing).
- **Roles:** Administrator
- **Returns:** `ActivityLog` object.

### `POST /api/activity-logs`
Ingest client activity events (page navigation, session duration, user actions). Buffered in memory on the server.
- **Roles:** Any authenticated user
- **Body:** `ActivityLog | ActivityLog[]`
- **Returns:** HTTP 202 Accepted.
- **Used by:** [`useActivityTracker.ts`](../src/hooks/useActivityTracker.ts)

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

## Real-Time Chat & Contextual Messaging (`/api/chat`)

> **Client Layer:** [`src/components/chat/chatApi.ts`](../src/components/chat/chatApi.ts) and [`src/context/ChatContext.tsx`](../src/context/ChatContext.tsx)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chat/stream` | `GET` | Persistent Server-Sent Events (SSE) stream (`connected`, `presence:snapshot`, `presence:update`, `message:new`, `message:updated`, `message:deleted`, `conversation:updated`, `conversation:read`, `typing`). |
| `/api/chat/presence` | `GET` | List currently online user IDs. |
| `/api/chat/users` | `GET` | Search active chat users directory (`?search=`). |
| `/api/chat/messages/search` | `GET` | Full-text message search across user's conversations (`?q=&limit=`). |
| `/api/chat/conversations` | `GET` | List user's conversations with `unreadCount`, `lastMessage`, `serverSeq`, and participants. |
| `/api/chat/conversations/direct` | `POST` | Get or create a 1-on-1 `DIRECT` conversation (`{ targetUserId }`). |
| `/api/chat/conversations/group` | `POST` | Create a `GROUP` conversation (`{ title, participantIds }`). |
| `/api/chat/conversations/project/:projectId` | `POST` | Get or create a contextual `PROJECT` conversation (`{ title? }`). |
| `/api/chat/conversations/:id/participants` | `POST` | Add participants to a group/project conversation (`{ userIds }`). |
| `/api/chat/conversations/:id/participants/:userId` | `DELETE` | Remove a participant from a conversation. |
| `/api/chat/conversations/:id` | `PATCH` | Rename a group/project conversation (`{ title }`). |
| `/api/chat/conversations/:id/mute` | `PATCH` | Mute or unmute notifications for a conversation (`{ muted }`). |
| `/api/chat/conversations/:id/messages` | `GET` | Cursor/sequence message fetch (`?limit=&beforeSeq=&sinceSeq=`). |
| `/api/chat/conversations/:id/messages` | `POST` | Send a message (`{ content, replyToId?, mentionedUserIds?, clientTempId? }`). |
| `/api/chat/messages/:id` | `PATCH` | Edit a sent message (`{ content }`). |
| `/api/chat/messages/:id` | `DELETE` | Soft-delete a message (`deletedAt` tombstone + `seq` bump). |
| `/api/chat/conversations/:id/read` | `POST` | Mark conversation read up to `lastReadSeq` (`{ seq? }`). |
| `/api/chat/conversations/:id/typing` | `POST` | Broadcast ephemeral typing status (`{ isTyping }`). |

---

## Client-Side Persistence & Delta Storage Engines

### 1. Chat IndexedDB Cache & Sequence Delta Sync (`src/components/chat/chatStorage.ts`)
- Stores conversations, messages (up to 400 per conversation), and sequence cursors in IndexedDB (`ekos_chat_cache_db`).
- Compares local `cursorSeq` against server `serverSeq` and fetches only incremental changes via `GET /api/chat/conversations/:id/messages?sinceSeq=<cursorSeq>`.

### 2. Multi-Tier Waste Catalog Storage (`src/utils/wasteCatalogStorage.ts`)
- **In-Memory Cache (Tier 1):** 0ms synchronous read access.
- **IndexedDB (`ekos_project_tracker_db`, Tier 2):** Persistent browser storage surviving page refreshes and browser restarts.
- **Cross-Tab `BroadcastChannel` (`ekos_waste_catalog_sync`):** Synchronizes additions, edits, or deletes across all open application tabs in real time.
- **Delta Sync:** Checks `syncedAt` against `/api/waste-catalog?since=...` to fetch only catalog updates and purge deleted codes.

### 3. Selective Query Cache Persistence (`src/utils/queryPersistence.ts`)
- Persists slow-changing user reference queries (`['users', 'directory']` and `['users', 'summary']`) in `localStorage` (`STORAGE_KEYS.QUERY_CACHE_PERSIST`, 24h TTL) and hydrates them synchronously on boot.
