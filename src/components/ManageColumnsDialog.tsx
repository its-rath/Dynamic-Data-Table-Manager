"use client";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { addColumn, removeColumn, reorderColumns, setColumnVisibility, setDensity } from '@/redux/slices/columnsSlice';

export default function ManageColumnsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const columns = useAppSelector((s) => s.columns);
  const [newField, setNewField] = useState('');

  const handleAdd = () => {
    const key = newField.trim();
    if (!key) return;
    dispatch(addColumn({ key }));
    setNewField('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Columns</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Box display="flex" gap={1}>
            <TextField
              label="Add field"
              placeholder="e.g., Department"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              fullWidth
              inputProps={{ 'aria-label': 'New column name' }}
            />
            <Button onClick={handleAdd} variant="contained" aria-label="Add new column">
              Add
            </Button>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={columns.density === 'compact'}
                onChange={(e) => dispatch(setDensity(e.target.checked ? 'compact' : 'comfortable'))}
              />
            }
            label="Compact density"
          />

          <List dense>
            {columns.order.map((key, index) => {
              const col = columns.byKey[key];
              if (!col) return null;
              return (
                <ListItem
                  key={key}
                  secondaryAction={
                    <IconButton edge="end" aria-label={`Delete column ${col?.label || key}`} onClick={() => dispatch(removeColumn(key))}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!col.visible}
                              onChange={(e) => dispatch(setColumnVisibility({ key, visible: e.target.checked }))}
                            />
                          }
                          label={col.label}
                        />
                        <Box display="flex" gap={1}>
                          <Button size="small" aria-label={`Move ${col.label} up`} onClick={() => index > 0 && dispatch(reorderColumns({ fromIndex: index, toIndex: index - 1 }))}>
                            Up
                          </Button>
                          <Button size="small" aria-label={`Move ${col.label} down`} onClick={() => index < columns.order.length - 1 && dispatch(reorderColumns({ fromIndex: index, toIndex: index + 1 }))}>
                            Down
                          </Button>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}


