"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Checkbox,
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  Button,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';
// Delete action removed - no delete icon
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import UploadIcon from '@mui/icons-material/UploadFile';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  cancelEditing,
  saveAllEdits,
  setPage,
  setRowsPerPage,
  setSearchQuery,
  sortBy,
  startEditing,
  toggleRowSelected,
  updateDraft,
} from '@/redux/slices/tableSlice';
import { addColumn } from '@/redux/slices/columnsSlice';
import ManageColumnsDialog from './ManageColumnsDialog';
import { exportCsv, parseCsv, validateRows } from '@/utils/csv';

export default function DataTable() {
  const dispatch = useAppDispatch();
  const { rows, searchQuery, page, rowsPerPage, sort, isEditing, editing, selectedRowIds, filteredRowIds } =
    useAppSelector((s) => s.table);
  const columns = useAppSelector((s) => s.columns);

  const visibleColumns = useMemo(() => columns.order.filter((k) => columns.byKey[k]?.visible), [columns]);
  const orderedColumns = useMemo(() => columns.order, [columns.order]);

  const filteredRows = useMemo(() => {
    const ids = filteredRowIds;
    return ids ? rows.filter((r) => ids.includes(r.id)) : rows;
  }, [rows, filteredRowIds]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  // Virtualization: we virtualize across the currently filtered (and paged) set
  const parentRef = useRef<HTMLDivElement | null>(null);

  const [manageOpen, setManageOpen] = useState(false);

  // A11y/keyboard nav: roving tabindex over grid cells
  const dataCols = useMemo(() => orderedColumns.filter((k) => columns.byKey[k]?.visible), [orderedColumns, columns]);
  const [focusRowIndex, setFocusRowIndex] = useState(0);
  const [focusColIndex, setFocusColIndex] = useState(0); // index into dataCols (not counting checkbox)
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  useEffect(() => {
    // Ensure focused indices are in range after filtering/pagination changes
    if (focusRowIndex >= pagedRows.length) setFocusRowIndex(Math.max(0, pagedRows.length - 1));
    if (focusColIndex >= dataCols.length) setFocusColIndex(Math.max(0, dataCols.length - 1));
  }, [pagedRows.length, dataCols.length]);

  useEffect(() => {
    // Focus the currently targeted cell
    const row = pagedRows[focusRowIndex];
    const colKey = dataCols[focusColIndex];
    const refKey = row && colKey ? `${row.id}:${colKey}` : '';
    const el = refKey ? cellRefs.current[refKey] : null;
    if (el) el.focus();
  }, [focusRowIndex, focusColIndex, pagedRows, dataCols]);

  // Virtualizer instance
  const rowHeight = columns.density === 'compact' ? 36 : 52;
  const rowVirtualizer = useVirtualizer({
    count: pagedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  useEffect(() => {
    rowVirtualizer.scrollToIndex(focusRowIndex, { align: 'auto' });
  }, [focusRowIndex]);

  const announceRef = useRef<HTMLDivElement | null>(null);
  const announce = (msg: string) => {
    if (announceRef.current) announceRef.current.textContent = msg;
  };

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = columns.order.indexOf(String(active.id));
    const toIndex = columns.order.indexOf(String(over.id));
    if (fromIndex >= 0 && toIndex >= 0) {
      dispatch({ type: 'columns/reorderColumns', payload: { fromIndex, toIndex } });
      announce(`Moved column to position ${toIndex + 1}`);
    }
  };

  const handleUpload = async (file: File) => {
    const raw = await parseCsv(file);
    const validation = validateRows(raw);
    if (!validation.ok) {
      alert(validation.error);
      return;
    }
    // Ensure any new columns are added
    const headers = Object.keys(raw[0] || {});
    headers.forEach((h) => dispatch(addColumn({ key: h })));
    // Convert to TableRow
    const withIds = raw.map((r) => ({ id: crypto.randomUUID(), ...coerceRow(r) }));
    // Replace all
    dispatch({ type: 'table/replaceAllRows', payload: withIds });
  };

  const coerceRow = (r: Record<string, string>) => {
    const obj: any = {};
    for (const [k, v] of Object.entries(r)) {
      if (k === 'Age') obj[k] = Number(v);
      else obj[k] = v;
    }
    return obj;
  };

  const onExport = () => {
    exportCsv(filteredRows, visibleColumns);
  };

  return (
  <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box p={2} borderBottom={1} borderColor={'divider'}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Dynamic Data Table Manager</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              inputProps={{ 'aria-label': 'Global search' }}
            />
            <Tooltip title="Manage Columns">
              <IconButton aria-label="Manage Columns" onClick={() => setManageOpen(true)}>
                <ViewColumnIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export CSV">
              <span>
                <IconButton aria-label="Export CSV" onClick={onExport} disabled={!filteredRows.length}>
                  <SaveAltIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button component="label" startIcon={<UploadIcon />} variant="outlined">
              Import CSV
              <input hidden type="file" accept=".csv" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
            </Button>
            <Tooltip title={isEditing ? 'Save all edits' : 'Start editing'}>
              <IconButton onClick={() => (isEditing ? dispatch(saveAllEdits()) : dispatch(startEditing()))}>
                {isEditing ? <CheckIcon /> : <EditIcon />}
              </IconButton>
            </Tooltip>
            {isEditing && (
              <Tooltip title="Cancel all edits">
                <IconButton onClick={() => dispatch(cancelEditing())}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      <Box sx={visuallyHidden} aria-live="polite" ref={announceRef} />

      <TableContainer sx={{ maxHeight: 640 }}>
        <Table
          size={columns.density === 'compact' ? 'small' : 'medium'}
          aria-label="Dynamic data grid"
          role="grid"
          aria-rowcount={filteredRows.length}
          aria-colcount={dataCols.length + 1}
          sx={{ borderCollapse: 'collapse' }}
        >
          <TableHead>
            <TableRow role="row">
              <TableCell padding="checkbox" role="columnheader" scope="col" aria-label="Select row">
                {/* placeholder for selection column, could add select all */}
              </TableCell>
              <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <SortableContext items={columns.order} strategy={horizontalListSortingStrategy}>
                  {orderedColumns.map((key, idx) => {
                    const col = columns.byKey[key];
                    if (!col?.visible) return null;
                    const active = sort.columnKey === key && !!sort.direction;
                    const sortDir: 'asc' | 'desc' | false = active ? (sort.direction === 'asc' ? 'asc' : 'desc') : false;
                    return (
                      <SortableHeaderCell
                        key={key}
                        id={key}
                        label={col.label}
                        width={col.width}
                        sortDir={sortDir}
                        active={active}
                        colIndex={idx + 2}
                        onSort={() => dispatch(sortBy(key))}
                        onResize={(delta) => dispatch({ type: 'columns/resizeColumn', payload: { key, width: Math.max(80, Math.min((col.width || 180) + delta, 600)) } })}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
              {/* Actions column removed */}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((row, index) => (
              <TableRow
                key={row.id}
                hover
                role="row"
                aria-selected={!!selectedRowIds[row.id]}
                aria-rowindex={page * rowsPerPage + index + 1}
              >
                <TableCell padding="checkbox" role="gridcell">
                  <Checkbox
                    checked={!!selectedRowIds[row.id]}
                    onChange={() => {
                      dispatch(toggleRowSelected(row.id));
                      announce(`${selectedRowIds[row.id] ? 'Unselected' : 'Selected'} row ${index + 1}`);
                    }}
                    inputProps={{ 'aria-label': `Select row ${row.id}` }}
                  />
                </TableCell>
                {orderedColumns.map((key, cIdx) => {
                  const col = columns.byKey[key];
                  if (!col?.visible) return null;
                  const value = (editing[row.id]?.[key] ?? row[key]) as any;
                  return (
                    <TableCell
                      key={key}
                      role="gridcell"
                      aria-colindex={cIdx + 2}
                      tabIndex={index === focusRowIndex && dataCols.indexOf(key) === focusColIndex ? 0 : -1}
                      ref={(el: HTMLTableCellElement | null) => {
                        cellRefs.current[`${row.id}:${key}`] = el;
                      }}
                      onKeyDown={(e) => {
                        const cIndex = dataCols.indexOf(key);
                        if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          setFocusColIndex(Math.min(dataCols.length - 1, cIndex + 1));
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          setFocusColIndex(Math.max(0, cIndex - 1));
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusRowIndex(Math.min(pagedRows.length - 1, index + 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusRowIndex(Math.max(0, index - 1));
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          setFocusColIndex(0);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          setFocusColIndex(Math.max(0, dataCols.length - 1));
                        } else if (e.key === 'PageDown') {
                          e.preventDefault();
                          dispatch(setPage(page + 1));
                          announce('Next page');
                        } else if (e.key === 'PageUp') {
                          e.preventDefault();
                          dispatch(setPage(Math.max(0, page - 1)));
                          announce('Previous page');
                        } else if (e.key === 'Enter' && isEditing) {
                          const input = (e.currentTarget.querySelector('input,textarea,select') as HTMLElement) || null;
                          if (input) {
                            e.preventDefault();
                            input.focus();
                          }
                        }
                      }}
                    >
                      {isEditing ? (
                        <TextField
                          size="small"
                          type={key === 'Age' ? 'number' : 'text'}
                          value={value as any}
                          onChange={(e) =>
                            dispatch(
                              updateDraft({ id: row.id, changes: { [key]: key === 'Age' ? Number(e.target.value) : e.target.value } })
                            )
                          }
                          inputProps={{ 'aria-label': `${key} for row ${row.id}` }}
                        />
                      ) : (
                        String(value ?? '')
                      )}
                    </TableCell>
                  );
                })}
                {/* Actions column removed */}
              </TableRow>
            ))}
            {!pagedRows.length && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} role="gridcell">
                  <Typography align="center" color="text.secondary">
                    No rows
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1}>
        <Typography variant="body2">{filteredRows.length} rows</Typography>
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 50]}
          count={filteredRows.length}
          page={page}
          onPageChange={(_, p) => dispatch(setPage(p))}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => dispatch(setRowsPerPage(parseInt(e.target.value, 10)))}
        />
      </Box>

      <ManageColumnsDialog open={manageOpen} onClose={() => setManageOpen(false)} />
    </Paper>
  );
}

function SortableHeaderCell({
  id,
  label,
  width,
  sortDir,
  active,
  colIndex,
  onSort,
  onResize,
}: {
  id: string;
  label: string;
  width?: number;
  sortDir: 'asc' | 'desc' | false;
  active: boolean;
  colIndex: number; // includes checkbox column offset
  onSort: () => void;
  onResize: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
  } as any;

  return (
    <TableCell
      ref={setNodeRef}
      style={{ width, ...style }}
      sortDirection={sortDir}
      role="columnheader"
      scope="col"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      aria-colindex={colIndex}
      onKeyDown={(e) => {
        // Keyboard resize with Ctrl+Arrow
        if (e.ctrlKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
          e.preventDefault();
          onResize(e.key === 'ArrowRight' ? 20 : -20);
        }
        // Space/Enter to sort
        if ((e.key === 'Enter' || e.key === ' ') && !e.ctrlKey) {
          e.preventDefault();
          onSort();
        }
      }}
    >
      <Box display="flex" alignItems="center" gap={1} {...attributes} {...listeners}>
        <TableSortLabel active={active} direction={active ? (sortDir as 'asc' | 'desc') : 'asc'} onClick={onSort}>
          {label}
        </TableSortLabel>
      </Box>
    </TableCell>
  );
}


