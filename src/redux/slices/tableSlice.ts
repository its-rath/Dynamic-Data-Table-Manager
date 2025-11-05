import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';

export type TableRow = {
  id: string;
  Name: string;
  Email: string;
  Age: number;
  Role: string;
  [key: string]: string | number;
};

export type SortDirection = 'asc' | 'desc' | null;

export type SortState = {
  columnKey: string | null;
  direction: SortDirection;
};

export interface TableState {
  rows: TableRow[];
  filteredRowIds: string[] | null;
  page: number;
  rowsPerPage: number;
  searchQuery: string;
  sort: SortState;
  editing: Record<string, Partial<TableRow>>; // id -> draft values
  isEditing: boolean;
  selectedRowIds: Record<string, boolean>;
}

const initialRows: TableRow[] = [
  { id: nanoid(), Name: 'Alice Johnson', Email: 'alice@example.com', Age: 29, Role: 'Engineer' },
  { id: nanoid(), Name: 'Bob Smith', Email: 'bob@example.com', Age: 35, Role: 'Manager' },
  { id: nanoid(), Name: 'Carol Chen', Email: 'carol@example.com', Age: 41, Role: 'Designer' },
  { id: nanoid(), Name: 'David Lee', Email: 'david@example.com', Age: 26, Role: 'Engineer' },
  { id: nanoid(), Name: 'Eve Adams', Email: 'eve@example.com', Age: 31, Role: 'Analyst' },
];

const initialState: TableState = {
  rows: initialRows,
  filteredRowIds: null,
  page: 0,
  rowsPerPage: 10,
  searchQuery: '',
  sort: { columnKey: null, direction: null },
  editing: {},
  isEditing: false,
  selectedRowIds: {},
};

function applySearch(rows: TableRow[], query: string): string[] | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;
  return rows
    .filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(trimmed))
    )
    .map((r) => r.id);
}

function sortRows(rows: TableRow[], sort: SortState): TableRow[] {
  if (!sort.columnKey || !sort.direction) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.columnKey!];
    const bv = b[sort.columnKey!];
    if (av === bv) return 0;
    if (av == null) return -1;
    if (bv == null) return 1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return sort.direction === 'asc' ? av - bv : bv - av;
    }
    return sort.direction === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
  return sorted;
}

export const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredRowIds = applySearch(state.rows, action.payload);
      state.page = 0;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 0;
    },
    sortBy(state, action: PayloadAction<string>) {
      const columnKey = action.payload;
      if (state.sort.columnKey === columnKey) {
        // cycle asc -> desc -> none
        if (state.sort.direction === 'asc') state.sort.direction = 'desc';
        else if (state.sort.direction === 'desc') state.sort = { columnKey: null, direction: null };
        else state.sort.direction = 'asc';
      } else {
        state.sort = { columnKey, direction: 'asc' };
      }
      state.rows = sortRows(state.rows, state.sort);
    },
    addRows(state, action: PayloadAction<TableRow[]>) {
      state.rows.push(...action.payload);
      // re-apply search and sort
      state.filteredRowIds = applySearch(state.rows, state.searchQuery);
      state.rows = sortRows(state.rows, state.sort);
    },
    replaceAllRows(state, action: PayloadAction<TableRow[]>) {
      state.rows = sortRows(action.payload, state.sort);
      state.filteredRowIds = applySearch(state.rows, state.searchQuery);
      state.page = 0;
      state.selectedRowIds = {};
    },
    deleteRow(state, action: PayloadAction<string>) {
      state.rows = state.rows.filter((r) => r.id !== action.payload);
      state.filteredRowIds = applySearch(state.rows, state.searchQuery);
    },
    startEditing(state) {
      state.isEditing = true;
      state.editing = {};
    },
    cancelEditing(state) {
      state.isEditing = false;
      state.editing = {};
    },
    updateDraft(state, action: PayloadAction<{ id: string; changes: Partial<TableRow> }>) {
      const { id, changes } = action.payload;
      state.editing[id] = { ...(state.editing[id] || {}), ...changes };
    },
    saveAllEdits(state) {
      if (!state.isEditing) return;
      state.rows = state.rows.map((r) => {
        const changes = state.editing[r.id] || {};
        const next: TableRow = { ...r };
        for (const [key, value] of Object.entries(changes)) {
          if (value !== undefined) (next as any)[key] = value as any;
        }
        return next;
      });
      state.isEditing = false;
      state.editing = {};
      state.rows = sortRows(state.rows, state.sort);
      state.filteredRowIds = applySearch(state.rows, state.searchQuery);
    },
    toggleRowSelected(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.selectedRowIds[id] = !state.selectedRowIds[id];
    },
    clearSelection(state) {
      state.selectedRowIds = {};
    },
  },
});

export const {
  setSearchQuery,
  setPage,
  setRowsPerPage,
  sortBy,
  addRows,
  replaceAllRows,
  deleteRow,
  startEditing,
  cancelEditing,
  updateDraft,
  saveAllEdits,
  toggleRowSelected,
  clearSelection,
} = tableSlice.actions;

export default tableSlice.reducer;


