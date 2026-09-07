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

List all projects. Supports search.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by name, client, responsible (case-insensitive contains) |

**Response:** `Project[]`

**Used by:** [`useAppData.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useAppData.ts)

---

### `POST /api/projects`

Create a new project.

**Request Body:** `Partial<Project>` (excluding `id`)

**Response (201):** Created `Project` object with `id`

**Used by:** [`useProjects.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useProjects.ts) via `useCrudOperations`

---

### `PUT /api/projects/:id`

Update an existing project.

**Request Body:** Full `Project` object (merged with existing data client-side)

**Response (200):** Updated `Project`

**Used by:** [`useProjects.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useProjects.ts) via `useCrudOperations`

---

### `DELETE /api/projects/:id`

Delete a project.

**Response (200):** `{ "message": "Deleted" }`

**Used by:** [`useProjects.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useProjects.ts) via `useCrudOperations`

---

### `PATCH /api/projects/:id/toggle-done`

Toggle project completion status.

**Response (200):** Updated `Project`

**Used by:** [`useProjects.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useProjects.ts) — `handleToggleDone`

---

### `PATCH /api/projects/:id/sample`

Advance the project's next sampling date.

**Response (200):** Updated `Project`

**Used by:** [`useProjects.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useProjects.ts) — `handleMarkSampled`

---

### `GET /api/projects/stats`

Dashboard aggregate statistics.

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

**Note:** This endpoint has **no authentication** on the server.

**Used by:** [`useAppData.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useAppData.ts)

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

**Used by:** [`useUsers.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useUsers.ts)

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

Create a permit with waste catalog associations.

**Request Body:**
```json
{
  "permitNumber": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "clientId": "uuid | null",
  "notes": "string",
  "wasteCatalogIds": ["uuid", "uuid"]
}
```

---

### `PUT /api/permits/:id` / `DELETE /api/permits/:id`

Standard CRUD. PUT updates waste catalog associations.

**Used by:** [`usePermits.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/usePermits.ts)

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

**Used by:** [`useAppData.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useAppData.ts) — `updatePreference(key, value)` with optimistic updates
