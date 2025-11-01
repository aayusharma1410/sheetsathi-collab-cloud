// Simple formula engine for basic spreadsheet calculations

type CellData = Record<string, string>;

export const evaluateFormula = (formula: string, allCells: CellData): string => {
  if (!formula || !formula.startsWith('=')) {
    return formula;
  }

  const formulaContent = formula.substring(1).toUpperCase();

  try {
    // SUM function
    if (formulaContent.startsWith('SUM(')) {
      const range = formulaContent.match(/SUM\((.*?)\)/)?.[1];
      if (range) {
        const values = parseRange(range, allCells);
        const sum = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
        return sum.toString();
      }
    }

    // AVERAGE function
    if (formulaContent.startsWith('AVERAGE(') || formulaContent.startsWith('AVG(')) {
      const range = formulaContent.match(/(AVERAGE|AVG)\((.*?)\)/)?.[2];
      if (range) {
        const values = parseRange(range, allCells);
        const sum = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
        return (sum / values.length).toString();
      }
    }

    // COUNT function
    if (formulaContent.startsWith('COUNT(')) {
      const range = formulaContent.match(/COUNT\((.*?)\)/)?.[1];
      if (range) {
        const values = parseRange(range, allCells);
        return values.filter(v => v && v.trim() !== '').length.toString();
      }
    }

    // Simple arithmetic operations
    if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(formulaContent)) {
      const result = eval(formulaContent);
      return result.toString();
    }

    // Cell reference (e.g., =A1)
    if (/^[A-Z]\d+$/.test(formulaContent)) {
      return allCells[formulaContent] || '';
    }

    return formula;
  } catch (error) {
    return '#ERROR';
  }
};

const parseRange = (range: string, allCells: CellData): string[] => {
  const values: string[] = [];

  // Handle comma-separated values (e.g., A1,B2,C3)
  if (range.includes(',')) {
    const cells = range.split(',').map(c => c.trim());
    cells.forEach(cell => {
      if (allCells[cell]) {
        values.push(allCells[cell]);
      }
    });
    return values;
  }

  // Handle range (e.g., A1:A10)
  if (range.includes(':')) {
    const [start, end] = range.split(':');
    const startCol = start.charCodeAt(0);
    const startRow = parseInt(start.substring(1));
    const endCol = end.charCodeAt(0);
    const endRow = parseInt(end.substring(1));

    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const cellKey = `${String.fromCharCode(col)}${row}`;
        if (allCells[cellKey]) {
          values.push(allCells[cellKey]);
        }
      }
    }
  }

  return values;
};
