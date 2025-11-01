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

    // MIN function
    if (formulaContent.startsWith('MIN(')) {
      const range = formulaContent.match(/MIN\((.*?)\)/)?.[1];
      if (range) {
        const values = parseRange(range, allCells).map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (values.length === 0) return '0';
        return Math.min(...values).toString();
      }
    }

    // MAX function
    if (formulaContent.startsWith('MAX(')) {
      const range = formulaContent.match(/MAX\((.*?)\)/)?.[1];
      if (range) {
        const values = parseRange(range, allCells).map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (values.length === 0) return '0';
        return Math.max(...values).toString();
      }
    }

    // PRODUCT function
    if (formulaContent.startsWith('PRODUCT(')) {
      const range = formulaContent.match(/PRODUCT\((.*?)\)/)?.[1];
      if (range) {
        const values = parseRange(range, allCells);
        const product = values.reduce((acc, val) => acc * (parseFloat(val) || 0), 1);
        return product.toString();
      }
    }

    // ROUND function
    if (formulaContent.startsWith('ROUND(')) {
      const match = formulaContent.match(/ROUND\((.*?),(.*?)\)/);
      if (match) {
        const value = parseFloat(match[1].trim());
        const decimals = parseInt(match[2].trim());
        if (!isNaN(value) && !isNaN(decimals)) {
          return value.toFixed(decimals);
        }
      }
    }

    // IF function
    if (formulaContent.startsWith('IF(')) {
      const match = formulaContent.match(/IF\((.*?),(.*?),(.*?)\)/);
      if (match) {
        const condition = match[1].trim();
        const trueValue = match[2].trim();
        const falseValue = match[3].trim();
        
        // Simple comparison operators
        if (condition.includes('>')) {
          const [left, right] = condition.split('>').map(s => parseFloat(s.trim()));
          return left > right ? trueValue : falseValue;
        } else if (condition.includes('<')) {
          const [left, right] = condition.split('<').map(s => parseFloat(s.trim()));
          return left < right ? trueValue : falseValue;
        } else if (condition.includes('=')) {
          const [left, right] = condition.split('=').map(s => s.trim());
          return left === right ? trueValue : falseValue;
        }
      }
    }

    // VLOOKUP function (simplified version)
    if (formulaContent.startsWith('VLOOKUP(')) {
      const match = formulaContent.match(/VLOOKUP\((.*?),(.*?),(.*?)\)/);
      if (match) {
        const lookupValue = match[1].trim();
        const range = match[2].trim();
        const colIndex = parseInt(match[3].trim());
        
        if (range.includes(':')) {
          const [start, end] = range.split(':');
          const startCol = start.charCodeAt(0);
          const startRow = parseInt(start.substring(1));
          const endRow = parseInt(end.substring(1));
          
          // Search in first column of range
          for (let row = startRow; row <= endRow; row++) {
            const cellKey = `${String.fromCharCode(startCol)}${row}`;
            if (allCells[cellKey] === lookupValue) {
              // Return value from specified column
              const resultKey = `${String.fromCharCode(startCol + colIndex - 1)}${row}`;
              return allCells[resultKey] || '';
            }
          }
        }
        return '#N/A';
      }
    }

    // ABS function
    if (formulaContent.startsWith('ABS(')) {
      const match = formulaContent.match(/ABS\((.*?)\)/);
      if (match) {
        const value = parseFloat(match[1].trim());
        if (!isNaN(value)) {
          return Math.abs(value).toString();
        }
      }
    }

    // SQRT function
    if (formulaContent.startsWith('SQRT(')) {
      const match = formulaContent.match(/SQRT\((.*?)\)/);
      if (match) {
        const value = parseFloat(match[1].trim());
        if (!isNaN(value) && value >= 0) {
          return Math.sqrt(value).toString();
        }
      }
    }

    // POWER function
    if (formulaContent.startsWith('POWER(')) {
      const match = formulaContent.match(/POWER\((.*?),(.*?)\)/);
      if (match) {
        const base = parseFloat(match[1].trim());
        const exponent = parseFloat(match[2].trim());
        if (!isNaN(base) && !isNaN(exponent)) {
          return Math.pow(base, exponent).toString();
        }
      }
    }

    // MOD function
    if (formulaContent.startsWith('MOD(')) {
      const match = formulaContent.match(/MOD\((.*?),(.*?)\)/);
      if (match) {
        const dividend = parseFloat(match[1].trim());
        const divisor = parseFloat(match[2].trim());
        if (!isNaN(dividend) && !isNaN(divisor) && divisor !== 0) {
          return (dividend % divisor).toString();
        }
      }
    }

    // CEILING function
    if (formulaContent.startsWith('CEILING(')) {
      const match = formulaContent.match(/CEILING\((.*?)\)/);
      if (match) {
        const value = parseFloat(match[1].trim());
        if (!isNaN(value)) {
          return Math.ceil(value).toString();
        }
      }
    }

    // FLOOR function
    if (formulaContent.startsWith('FLOOR(')) {
      const match = formulaContent.match(/FLOOR\((.*?)\)/);
      if (match) {
        const value = parseFloat(match[1].trim());
        if (!isNaN(value)) {
          return Math.floor(value).toString();
        }
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
