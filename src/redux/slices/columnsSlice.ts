import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
  width?: number;
};

export interface ColumnsState {
  order: string[]; // keys order
  byKey: Record<string, ColumnConfig>;
  density: 'compact' | 'comfortable';
}

const defaultColumns: ColumnConfig[] = [
  { key: 'Name', label: 'Name', visible: true, width: 220 },
  { key: 'Email', label: 'Email', visible: true, width: 260 },
  { key: 'Age', label: 'Age', visible: true, width: 100 },
  { key: 'Role', label: 'Role', visible: true, width: 180 },
];

const initialState: ColumnsState = {
  order: defaultColumns.map((c) => c.key),
  byKey: Object.fromEntries(defaultColumns.map((c) => [c.key, c])),
  density: 'comfortable',
};

export const columnsSlice = createSlice({
  name: 'columns',
  initialState,
  reducers: {
    toggleColumn(state, action: PayloadAction<string>) {
      const key = action.payload;
      const col = state.byKey[key];
      if (col) col.visible = !col.visible;
    },
    setColumnVisibility(state, action: PayloadAction<{ key: string; visible: boolean }>) {
      const { key, visible } = action.payload;
      const col = state.byKey[key];
      if (col) col.visible = visible;
    },
    addColumn(state, action: PayloadAction<{ key: string; label?: string }>) {
      const { key, label } = action.payload;
      if (!state.byKey[key]) {
        const newCol: ColumnConfig = { key, label: label || key, visible: true, width: 180 };
        state.byKey[key] = newCol;
        state.order.push(key);
      }
    },
    removeColumn(state, action: PayloadAction<string>) {
      const key = action.payload;
      delete state.byKey[key];
      state.order = state.order.filter((k) => k !== key);
    },
    reorderColumns(state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) {
      const { fromIndex, toIndex } = action.payload;
      const current = [...state.order];
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      state.order = current;
    },
    resizeColumn(state, action: PayloadAction<{ key: string; width: number }>) {
      const { key, width } = action.payload;
      const col = state.byKey[key];
      if (col) col.width = Math.max(80, Math.min(width, 600));
    },
    setDensity(state, action: PayloadAction<'compact' | 'comfortable'>) {
      state.density = action.payload;
    },
  },
});

export const {
  toggleColumn,
  setColumnVisibility,
  addColumn,
  removeColumn,
  reorderColumns,
  resizeColumn,
  setDensity,
} = columnsSlice.actions;

export default columnsSlice.reducer;


