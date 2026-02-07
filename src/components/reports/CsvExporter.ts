/**
 * Utility for generating and downloading CSV files.
 * Uses ";" separator and UTF-8 BOM for Excel compatibility.
 */
export function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const BOM = '\uFEFF';
  const headerLine = headers.join(';');
  const bodyLines = rows.map((row) =>
    row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(';')
  );
  const csvContent = BOM + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
