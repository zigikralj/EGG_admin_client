import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UseTableViewOptions {
  // ── Column visibility ────────────────────────────────────────────────────
  /** Default columns to show when no external columns are provided */
  defaultColumns?: string[];
  /** Controlled visible columns (from user preferences) */
  visibleColumns?: string[];
  /** Callback when visible columns change */
  onVisibleColumnsChange?: (cols: string[]) => void;

  // ── Pagination ───────────────────────────────────────────────────────────
  /** Default rows per page when no external value is provided */
  defaultRowsPerPage?: number;
  /** Default rows-per-page options */
  defaultRowsPerPageOptions?: number[];
  /** Controlled rows per page (from user preferences) */
  rowsPerPageProp?: number;
  /** Callback when rows per page changes */
  onRowsPerPageChange?: (rpp: number) => void;
  /** Controlled rows-per-page options (from user preferences) */
  rowsPerPageOptionsProp?: number[];
  /** Callback when rows-per-page options change */
  onRowsPerPageOptionsChange?: (opts: number[]) => void;

  // ── Sorting ──────────────────────────────────────────────────────────────
  /** Default sort field when no external sort state is provided */
  defaultSortField?: string;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Controlled sort state (from user preferences) */
  sortState?: SortState;
  /** Callback when sort changes */
  onSortChange?: (sort: SortState) => void;

  // ── Refresh ──────────────────────────────────────────────────────────────
  /** Callback to refresh data */
  onRefresh?: () => Promise<void> | void;
}

export interface UseTableViewReturn {
  // ── Column visibility ────────────────────────────────────────────────────
  /** The currently active columns (controlled or local) */
  activeCols: string[];
  /** Set visible columns (updates both local + external) */
  setCols: (cols: string[]) => void;

  // ── Pagination ───────────────────────────────────────────────────────────
  /** Active rows per page value */
  activeRowsPerPage: number;
  /** Active rows-per-page options */
  activeRowsPerPageOptions: number[];
  /** Set rows per page (updates both local + external) */
  setRowsPerPageValue: (rpp: number) => void;
  /** Set rows-per-page options (updates both local + external) */
  setRowsPerPageOptionsValue: (opts: number[]) => void;
  /** Current page index */
  page: number;
  /** Set current page */
  setPage: (page: number) => void;

  // ── Sorting ──────────────────────────────────────────────────────────────
  /** Current sort column */
  sortColumn: string;
  /** Current sort direction */
  sortDirection: 'asc' | 'desc';
  /** Handle clicking a column header to sort */
  handleSort: (colId: string) => void;
  /** Change sort column without toggling direction */
  handleSortColumnChange: (colId: string) => void;
  /** Toggle sort direction on the current column */
  handleToggleSortDirection: () => void;
  /** Reset sort to defaults */
  resetSort: () => void;

  // ── Refresh ──────────────────────────────────────────────────────────────
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
  /** Trigger a refresh */
  handleRefresh: () => Promise<void>;

  // ── Error / Saving ─────────────────────────────────────────────────────
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Set saving state */
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  /** Error dialog state */
  errorDialogState: { open: boolean; message: string };
  /** Set error dialog state */
  setErrorDialogState: React.Dispatch<React.SetStateAction<{ open: boolean; message: string }>>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTableView(options: UseTableViewOptions = {}): UseTableViewReturn {
  const {
    // Columns
    defaultColumns = [],
    visibleColumns,
    onVisibleColumnsChange,
    // Pagination
    defaultRowsPerPage = 15,
    defaultRowsPerPageOptions = [15, 25, 50],
    rowsPerPageProp,
    onRowsPerPageChange,
    rowsPerPageOptionsProp,
    onRowsPerPageOptionsChange,
    // Sorting
    defaultSortField = 'name',
    defaultSortDirection = 'asc',
    sortState,
    onSortChange,
    // Refresh
    onRefresh,
  } = options;

  // ── Column visibility ──────────────────────────────────────────────────────

  const [localColumns, setLocalColumns] = useState<string[]>(visibleColumns ?? defaultColumns);

  const activeCols = onVisibleColumnsChange ? (visibleColumns ?? defaultColumns) : localColumns;

  const setCols = useCallback((cols: string[]) => {
    setLocalColumns(cols);
    if (onVisibleColumnsChange) onVisibleColumnsChange(cols);
  }, [onVisibleColumnsChange]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const [page, setPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPageProp ?? defaultRowsPerPage);
  const [localRowsPerPageOptions, setLocalRowsPerPageOptions] = useState<number[]>(
    rowsPerPageOptionsProp ?? defaultRowsPerPageOptions,
  );

  useEffect(() => {
    if (rowsPerPageProp !== undefined) {
      setLocalRowsPerPage(rowsPerPageProp);
    }
  }, [rowsPerPageProp]);

  useEffect(() => {
    if (rowsPerPageOptionsProp !== undefined) {
      setLocalRowsPerPageOptions(rowsPerPageOptionsProp);
    }
  }, [rowsPerPageOptionsProp]);

  const activeRowsPerPage =
    onRowsPerPageChange && rowsPerPageProp !== undefined ? rowsPerPageProp : localRowsPerPage;
  const activeRowsPerPageOptions =
    onRowsPerPageOptionsChange && rowsPerPageOptionsProp !== undefined
      ? rowsPerPageOptionsProp
      : localRowsPerPageOptions;

  const setRowsPerPageValue = useCallback(
    (rpp: number) => {
      setLocalRowsPerPage(rpp);
      if (onRowsPerPageChange) onRowsPerPageChange(rpp);
    },
    [onRowsPerPageChange],
  );

  const setRowsPerPageOptionsValue = useCallback(
    (opts: number[]) => {
      setLocalRowsPerPageOptions(opts);
      if (onRowsPerPageOptionsChange) onRowsPerPageOptionsChange(opts);
    },
    [onRowsPerPageOptionsChange],
  );

  // ── Sorting ────────────────────────────────────────────────────────────────

  const [sortColumn, setSortColumn] = useState<string>(sortState?.field || defaultSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    sortState?.direction || defaultSortDirection,
  );

  useEffect(() => {
    if (sortState) {
      setSortColumn(sortState.field || defaultSortField);
      setSortDirection(sortState.direction || defaultSortDirection);
    }
  }, [sortState, defaultSortField, defaultSortDirection]);

  const handleSort = useCallback(
    (colId: string) => {
      let newDir: 'asc' | 'desc' = 'asc';
      if (sortColumn === colId) {
        newDir = sortDirection === 'asc' ? 'desc' : 'asc';
      }
      setSortColumn(colId);
      setSortDirection(newDir);
      if (onSortChange) {
        onSortChange({ field: colId, direction: newDir });
      }
    },
    [sortColumn, sortDirection, onSortChange],
  );

  const handleSortColumnChange = useCallback(
    (colId: string) => {
      setSortColumn(colId);
      if (onSortChange) {
        onSortChange({ field: colId, direction: sortDirection });
      }
    },
    [sortDirection, onSortChange],
  );

  const handleToggleSortDirection = useCallback(() => {
    const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDir);
    if (onSortChange) {
      onSortChange({ field: sortColumn, direction: newDir });
    }
  }, [sortColumn, sortDirection, onSortChange]);

  const resetSort = useCallback(() => {
    setSortColumn(defaultSortField);
    setSortDirection(defaultSortDirection);
    if (onSortChange) {
      onSortChange({ field: defaultSortField, direction: defaultSortDirection });
    }
  }, [defaultSortField, defaultSortDirection, onSortChange]);

  // ── Refresh ────────────────────────────────────────────────────────────────

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // ── Error / Saving ─────────────────────────────────────────────────────────

  const [isSaving, setIsSaving] = useState(false);
  const [errorDialogState, setErrorDialogState] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // Columns
    activeCols,
    setCols,
    // Pagination
    activeRowsPerPage,
    activeRowsPerPageOptions,
    setRowsPerPageValue,
    setRowsPerPageOptionsValue,
    page,
    setPage,
    // Sorting
    sortColumn,
    sortDirection,
    handleSort,
    handleSortColumnChange,
    handleToggleSortDirection,
    resetSort,
    // Refresh
    isRefreshing,
    handleRefresh,
    // Error / Saving
    isSaving,
    setIsSaving,
    errorDialogState,
    setErrorDialogState,
  };
}
