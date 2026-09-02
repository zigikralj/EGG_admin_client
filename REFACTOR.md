# Refactoring TODO

## Checklist

- [ ] **1. `useTableView` hook** 🔴 High — _11 files, ~330 lines saved_
  - [x] Create `hooks/useTableView.ts` with pagination, sorting, refresh, columns logic
  - [x] Refactor `ClientsView` to use `useTableView`
  - [x] Refactor `CategoriesView` to use `useTableView`
  - [x] Refactor `ServicesView` to use `useTableView`
  - [x] Refactor `UsersView` to use `useTableView`
  - [x] Refactor `ProjectsView` to use `useTableView`
  - [x] Refactor `RemindersView` to use `useTableView`
  - [x] Refactor `InvoicesView` to use `useTableView`
  - [x] Refactor `ProvidedServicesView` to use `useTableView`
  - [x] Refactor `ReminderPanel` to use `useTableView`
  - [x] Refactor `ApproachingInvoicesPanel` to use `useTableView`
  - [x] Refactor `WasteDisposalPanel` to use `useTableView`
- [x] **Phase 2: Invoice Section shared components** 🔴 High — _2 files, ~600+ lines saved_
  - [x] Extract `InvoiceStatusChip` and `InvoiceTypeChip` logic into reusable elements (e.g. `InvoiceChips.tsx`).
  - [x] Extract the repeatable invoice item adding/listing logic (`InvoiceItemsList.tsx`).
  - [x] Standardize `InvoiceFormFields` for "New Invoice" and "Edit Invoice" so we don't repeat the same grid of fields.
  - [x] Refactor `ProjectInvoiceSection` to use shared components
  - [x] Refactor `ProvidedServiceInvoiceSection` to use shared components
- [x] **3. `TableViewProps` shared type** 🟡 Medium — _8 files, ~80 lines saved_
  - [x] Add `SortState` and `TableViewProps` interfaces to `types.ts`
  - [x] Update all 8 view `Props` interfaces to extend `TableViewProps`
- [x] **4. `createFetcher` in `useAppData`** 🟡 Medium — _1 file, ~50 lines saved_
  - [x] Create generic `createFetcher` factory function
  - [x] Replace 7 identical fetch functions in `useAppData.ts`
- [x] **5. `useStatusUpdate` hook** 🟢 Low — _2-3 hooks, ~40 lines saved_
  - [x] Create `useStatusUpdate` hook (or extend `useCrudOperations`)
  - [x] Refactor `useReminders.ts` `handleStatusChangeReminder`
  - [x] Refactor `useInvoices.ts` `handleUpdateInvoiceStatus`
  - [x] Refactor `useUsers.ts` approve/reject/forceLogout handlers

---

# Refactoring Candidates Analysis

After scanning the entire codebase, I identified **5 major duplication areas** ranked by impact. Here's the analysis:

---

## 1. 🔴 Table View Boilerplate — `useTableView` hook
**Impact: ~11 files, ~300+ duplicated lines**

Every view component ([`ClientsView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/ClientsView.tsx), [`CategoriesView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/CategoriesView.tsx), [`ServicesView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/ServicesView.tsx), [`UsersView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/UsersView.tsx), [`ProjectsView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/ProjectsView.tsx), [`RemindersView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/RemindersView.tsx), [`InvoicesView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/InvoicesView.tsx), [`ProvidedServicesView`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/views/ProvidedServicesView.tsx), plus panels [`ReminderPanel`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/ReminderPanel.tsx), [`ApproachingInvoicesPanel`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/ApproachingInvoicesPanel.tsx), [`WasteDisposalPanel`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/WasteDisposalPanel.tsx)) copy-pastes the same **~30-line block** for:

| Duplicated Logic | Lines per file |
|---|---|
| `localRowsPerPage` / `localRowsPerPageOptions` state + sync effects | ~15 |
| `activeRowsPerPage` / `activeRowsPerPageOptions` derived values | ~4 |
| `setRowsPerPageValue` / `setRowsPerPageOptionsValue` wrappers | ~8 |
| `handleRefresh` + `isRefreshing` state | ~10 |
| `sortColumn` / `sortDirection` state + sync effects | ~8 |
| `handleSort` / `handleSortColumnChange` / `handleToggleSortDirection` | ~20 |
| `activeCols` / `setCols` column management | ~4 |
| `errorDialogState` + `isSaving` state | ~5 |

### Proposed fix: `useTableView` hook

```typescript
// hooks/useTableView.ts
export function useTableView(options: {
  defaultSortField?: string;
  defaultColumns: string[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  rowsPerPageProp?: number;
  onRowsPerPageChange?: (rpp: number) => void;
  rowsPerPageOptionsProp?: number[];
  onRowsPerPageOptionsChange?: (opts: number[]) => void;
  sortState?: { field: string; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
  onRefresh?: () => Promise<void> | void;
}) { /* ... returns all the state + handlers */ }
```

> [!TIP]
> This single hook would eliminate **~30 lines × 11 files ≈ 330 duplicated lines** and ensure consistent pagination/sorting behavior across all views.

---

## 2. 🔴 Invoice Section Duplication — shared `InvoiceFormFields` component
**Impact: 2 files, ~800+ duplicated lines**

[`ProjectInvoiceSection`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/project/ProjectInvoiceSection.tsx) (907 lines) and [`ProvidedServiceInvoiceSection`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/components/providedService/ProvidedServiceInvoiceSection.tsx) (1030 lines) are **~75% identical**. They share:

| Duplicated Element | Approx. Lines |
|---|---|
| `getInvoiceStatusChip()` — identical switch statement | ~25 |
| Invoice "new" form state (number, type, date, currency, status, notes, items) | ~15 |
| Invoice "edit" form state (same set of fields) | ~15 |
| New invoice form JSX (TextField, Select, Autocomplete for type/currency/status) | ~200 |
| Edit invoice dialog JSX | ~200 |
| Invoice items list (add/remove rows, currency per row) | ~80 |
| Status change logic + "Mark as Paid" dialog | ~50 |
| Invoice card rendering (each linked invoice card) | ~100 |

### Proposed fix
- Extract `getInvoiceStatusChip` → shared utility or small component
- Extract `InvoiceFormFields` component (used by both "new" and "edit" dialogs)
- Extract `InvoiceItemsList` component
- Extract `useInvoiceFormState` hook for the ~15 state variables that both sections declare identically

> [!IMPORTANT]
> This is the single **highest-ROI refactor** — it consolidates **~1,200 lines** in two files down to shared building blocks.

---

## 3. 🟡 Props Interface Pattern — shared `TableViewProps` type
**Impact: 8 files, ~80 duplicated lines**

Every view's `Props` interface repeats the same 8 optional props verbatim:

```typescript
// Copied in ClientsView, CategoriesView, ServicesView, UsersView,
// ProjectsView, RemindersView, InvoicesView, ProvidedServicesView
visibleColumns?: string[];
onVisibleColumnsChange?: (cols: string[]) => void;
rowsPerPageOptions?: number[];
onRowsPerPageOptionsChange?: (options: number[]) => void;
rowsPerPage?: number;
onRowsPerPageChange?: (rowsPerPage: number) => void;
sortState?: { field: string; direction: 'asc' | 'desc' };
onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
onRefresh?: () => Promise<void> | void;
```

### Proposed fix: shared `TableViewProps` interface in [`types.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/types.ts)

```typescript
export interface TableViewProps {
  visibleColumns?: string[];
  onVisibleColumnsChange?: (cols: string[]) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageOptionsChange?: (options: number[]) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
  onRefresh?: () => Promise<void> | void;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}
```

Then each view extends it: `interface Props extends TableViewProps { clients: Client[]; ... }`

---

## 4. 🟡 Fetch Functions Boilerplate — generic `createFetcher` in `useAppData`
**Impact: 1 file, ~50 duplicated lines**

In [`useAppData.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useAppData.ts), 7 out of 9 fetch functions follow the **exact same pattern**:

```typescript
const fetchX = useCallback(async () => {
  try {
    const res = await apiFetch('/api/x', { headers: authHeaders() });
    if (res.ok) setX(await res.json());
  } catch (error) {
    console.error('Error fetching x:', error);
  }
}, [authHeaders, setX]);
```

Only `fetchProjects` (adds search query) and `fetchUsers` (adds logout check) are different.

### Proposed fix: generic factory

```typescript
function createFetcher<T>(
  path: string,
  setter: (data: T[]) => void,
  authHeaders: () => Record<string, string>,
) {
  return async () => {
    try {
      const res = await apiFetch(path, { headers: authHeaders() });
      if (res.ok) setter(await res.json());
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
    }
  };
}
```

---

## 5. 🟢 Status Change Handlers — `useStatusUpdate` hook
**Impact: 2 hooks, ~40 duplicated lines**

[`useReminders.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useReminders.ts#L32-L60) `handleStatusChangeReminder` and [`useInvoices.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useInvoices.ts#L32-L60) `handleUpdateInvoiceStatus` follow the same optimistic-update pattern:

1. Save previous state
2. Optimistically update local state
3. PATCH `/api/{resource}/{id}/status`
4. On success → refetch
5. On failure → rollback + alert

Similarly, [`useUsers.ts`](file:///Users/nemanja.stanojevic/Documents/zigicode/EkosGreenGroup/project_tracker/client/src/hooks/useUsers.ts) has 3 functions (`handleApproveUser`, `handleRejectUser`, `handleForceLogoutUser`) with the same try/catch+fetch+alert pattern.

### Proposed fix

```typescript
// hooks/useStatusUpdate.ts — or extend useCrudOperations
function useStatusUpdate<T extends { id: string }>({
  basePath, items, setItems, authHeaders, onSuccess
}) {
  return useCallback(async (id: string, body: Record<string, any>) => {
    const previous = [...items];
    setItems(items.map(item => item.id === id ? { ...item, ...body } : item));
    try {
      const res = await apiFetch(`${basePath}/${id}/status`, { method: 'PATCH', ... });
      if (res.ok) onSuccess();
      else { setItems(previous); /* error handling */ }
    } catch { setItems(previous); }
  }, [...]);
}
```

---

## Summary & Priority

| # | Candidate | Files | Lines Saved | Risk | Priority |
|---|---|---|---|---|---|
| 1 | `useTableView` hook | 11 | ~330 | Low | 🔴 **High** |
| 2 | Invoice Section shared components | 2 | ~600+ | Medium | 🔴 **High** |
| 3 | `TableViewProps` shared type | 8 | ~80 | Very Low | 🟡 **Medium** |
| 4 | `createFetcher` in `useAppData` | 1 | ~50 | Very Low | 🟡 **Medium** |
| 5 | `useStatusUpdate` hook | 2-3 | ~40 | Low | 🟢 **Low** |

> [!NOTE]
> Items 1 and 3 are closely related — extracting `TableViewProps` is a natural first step before building `useTableView`. I'd recommend tackling them together.

> [!IMPORTANT]
> Item 2 (Invoice Sections) is the highest-ROI individual refactor but carries more risk since those components are large and complex. Consider doing it after items 1+3 are stable.

Would you like me to proceed with implementing any of these refactors?
