// Utility functions for exporting spreadsheets

type CellData = {
  row: number;
  col: number;
  value: string;
};

export const exportToCSV = (cells: CellData[], rows: number, cols: number, filename: string) => {
  const grid: string[][] = Array.from({ length: rows }, () => 
    Array.from({ length: cols }, () => '')
  );

  cells.forEach(cell => {
    if (cell.row < rows && cell.col < cols) {
      grid[cell.row][cell.col] = cell.value || '';
    }
  });

  const csvContent = grid
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
