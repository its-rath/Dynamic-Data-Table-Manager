import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { TableRow } from '@/redux/slices/tableSlice';

export function parseCsv(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      error: (err) => reject(err),
      complete: (results) => resolve(results.data),
    });
  });
}

export function validateRows(rows: Record<string, string>[]): { ok: boolean; error?: string } {
  const required = ['Name', 'Email', 'Age', 'Role'];
  if (!rows.length) return { ok: false, error: 'CSV contains no data' };
  const headers = Object.keys(rows[0] || {});
  for (const r of required) {
    if (!headers.includes(r)) return { ok: false, error: `Missing required column: ${r}` };
  }
  return { ok: true };
}

export function exportCsv(
  rows: TableRow[],
  visibleColumns: string[],
  fileName = 'data.csv'
): void {
  const plain = rows.map((r) => {
    const obj: Record<string, string | number> = {};
    for (const key of visibleColumns) {
      obj[key] = r[key] as any;
    }
    return obj;
  });
  const csv = Papa.unparse(plain);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, fileName);
}


