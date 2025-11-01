import { useState, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { evaluateFormula } from "@/lib/formulaEngine";

type CellType = {
  id?: string;
  value: string;
  formula?: string;
  comments?: Array<{ id: string; comment: string; created_at: string }>;
};

type SpreadsheetGridProps = {
  spreadsheetId: string;
  rows: number;
  cols: number;
  onCellUpdate?: () => void;
};

const SpreadsheetGrid = ({ spreadsheetId, rows, cols, onCellUpdate }: SpreadsheetGridProps) => {
  const [cells, setCells] = useState<Record<string, CellType>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sortConfig, setSortConfig] = useState<{ col: number; direction: 'asc' | 'desc' } | null>(null);

  const columnLabels = Array.from({ length: cols }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  useEffect(() => {
    loadCells();
    subscribeToChanges();
  }, [spreadsheetId]);

  const loadCells = async () => {
    const { data, error } = await supabase
      .from('cells')
      .select('*')
      .eq('spreadsheet_id', spreadsheetId);

    if (error) {
      toast.error("Failed to load cells");
      return;
    }

    const cellsMap: Record<string, CellType> = {};
    data?.forEach(cell => {
      const key = `${cell.row_index}-${cell.col_index}`;
      cellsMap[key] = {
        id: cell.id,
        value: cell.value || '',
        formula: cell.formula || '',
      };
    });
    setCells(cellsMap);
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('cells-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cells',
          filter: `spreadsheet_id=eq.${spreadsheetId}`
        },
        () => {
          loadCells();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCellChange = async (rowIndex: number, colIndex: number, value: string) => {
    const key = `${rowIndex}-${colIndex}`;
    const cellId = cells[key]?.id;

    // Update local state
    const allCellValues: Record<string, string> = {};
    Object.entries(cells).forEach(([k, cell]) => {
      const [r, c] = k.split('-').map(Number);
      const cellRef = `${String.fromCharCode(65 + c)}${r + 1}`;
      allCellValues[cellRef] = cell.value;
    });

    const displayValue = value.startsWith('=') 
      ? evaluateFormula(value, allCellValues)
      : value;

    setCells(prev => ({
      ...prev,
      [key]: { ...prev[key], value: displayValue, formula: value }
    }));

    // Save to database
    if (cellId) {
      await supabase
        .from('cells')
        .update({ value: displayValue, formula: value.startsWith('=') ? value : null })
        .eq('id', cellId);
    } else {
      await supabase
        .from('cells')
        .insert({
          spreadsheet_id: spreadsheetId,
          row_index: rowIndex,
          col_index: colIndex,
          value: displayValue,
          formula: value.startsWith('=') ? value : null
        });
    }

    onCellUpdate?.();
  };

  const handleAddComment = async () => {
    if (!selectedCell || !comment.trim()) return;

    const [rowIndex, colIndex] = selectedCell.split('-').map(Number);
    const key = `${rowIndex}-${colIndex}`;
    let cellId = cells[key]?.id;

    // Create cell if it doesn't exist
    if (!cellId) {
      const { data } = await supabase
        .from('cells')
        .insert({
          spreadsheet_id: spreadsheetId,
          row_index: rowIndex,
          col_index: colIndex,
          value: ''
        })
        .select()
        .single();
      
      cellId = data?.id;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('comments')
      .insert({
        cell_id: cellId,
        user_id: user?.id,
        comment: comment.trim()
      });

    toast.success("Comment added");
    setComment("");
    setSelectedCell(null);
  };

  const handleSort = (colIndex: number) => {
    const direction = sortConfig?.col === colIndex && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ col: colIndex, direction });

    // Get all values in this column
    const columnData: Array<{ row: number; value: string }> = [];
    for (let r = 0; r < rows; r++) {
      const key = `${r}-${colIndex}`;
      columnData.push({ row: r, value: cells[key]?.value || '' });
    }

    // Sort
    columnData.sort((a, b) => {
      const aVal = a.value;
      const bVal = b.value;
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    toast.success(`Column ${columnLabels[colIndex]} sorted ${direction === 'asc' ? 'A→Z' : 'Z→A'}`);
  };

  return (
    <div className="inline-block min-w-full">
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Column Headers */}
        <div className="flex sticky top-0 z-10 bg-secondary">
          <div className="w-12 h-10 border-r border-b border-border flex items-center justify-center text-xs font-medium bg-secondary" />
          {columnLabels.map((label, colIndex) => (
            <div
              key={label}
              className="w-32 h-10 border-r border-b border-border flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-accent/50"
              onClick={() => handleSort(colIndex)}
            >
              {label}
              {sortConfig?.col === colIndex && (
                <span className="ml-1 text-xs">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex hover:bg-accent/5">
            {/* Row Number */}
            <div className="w-12 h-10 border-r border-b border-border flex items-center justify-center text-xs font-medium bg-secondary">
              {rowIndex + 1}
            </div>
            {/* Cells */}
            {Array.from({ length: cols }, (_, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              const cellValue = cells[key]?.value || '';
              
              return (
                <div
                  key={key}
                  className="w-32 h-10 border-r border-b border-border relative group"
                >
                  <input
                    type="text"
                    value={cellValue}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    className="w-full h-full px-2 bg-transparent focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:z-10 relative"
                    placeholder=""
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedCell(key)}
                      >
                        <MessageSquarePlus className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Add Comment</h4>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Type your comment..."
                          rows={3}
                        />
                        <Button onClick={handleAddComment} size="sm" className="w-full">
                          Add Comment
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpreadsheetGrid;
