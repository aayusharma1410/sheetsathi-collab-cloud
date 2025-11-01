import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { MessageSquarePlus, Undo, Redo, Trash2, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { evaluateFormula } from "@/lib/formulaEngine";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  canEdit?: boolean;
  onSave?: () => Promise<void>;
};

const SpreadsheetGrid = forwardRef<any, SpreadsheetGridProps>(({ spreadsheetId, rows, cols, onCellUpdate, canEdit = true, onSave }, ref) => {
  const [cells, setCells] = useState<Record<string, CellType>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sortConfig, setSortConfig] = useState<{ col: number; direction: 'asc' | 'desc' } | null>(null);
  const [history, setHistory] = useState<Record<string, CellType>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [activityLog, setActivityLog] = useState<Array<{
    id: string;
    user_name: string;
    action: string;
    row_index: number | null;
    col_index: number | null;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
  }>>([]);
  const [notes, setNotes] = useState("");

  const columnLabels = Array.from({ length: cols }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  useImperativeHandle(ref, () => ({
    savePendingChanges
  }));

  useEffect(() => {
    loadCells();
    loadActivityLog();
    loadNotes();
    subscribeToChanges();
  }, [spreadsheetId]);

  const loadCells = async () => {
    const { data, error } = await supabase
      .from('cells')
      .select(`
        *,
        comments (
          id,
          comment,
          created_at,
          user_id
        )
      `)
      .eq('spreadsheet_id', spreadsheetId);

    if (error) {
      console.error("Error loading cells:", error);
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
        comments: cell.comments || [],
      };
    });
    setCells(cellsMap);
  };

  const loadActivityLog = async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        id,
        action,
        row_index,
        col_index,
        old_value,
        new_value,
        created_at,
        user_id
      `)
      .eq('spreadsheet_id', spreadsheetId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading activity log:", error);
      return;
    }

    // Fetch user display names and emails
    const userIds = [...new Set(data?.map(log => log.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', userIds);

    const nameMap = new Map(
      profiles?.map(p => [
        p.id, 
        p.display_name || p.email?.split('@')[0] || 'User'
      ]) || []
    );

    setActivityLog(data?.map(log => ({
      ...log,
      user_name: nameMap.get(log.user_id) || 'User'
    })) || []);
  };

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from('spreadsheets')
      .select('notes')
      .eq('id', spreadsheetId)
      .single();

    if (error) {
      console.error("Error loading notes:", error);
      return;
    }

    setNotes(data?.notes || '');
  };

  const saveNotes = async (newNotes: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit notes");
      return;
    }

    const { error } = await supabase
      .from('spreadsheets')
      .update({ notes: newNotes })
      .eq('id', spreadsheetId);

    if (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
      return;
    }

    toast.success("Notes saved");
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
    console.log("Attempting to edit cell - canEdit:", canEdit);
    
    if (!canEdit) {
      console.error("Edit blocked - user does not have edit permission");
      toast.error("You don't have permission to edit this spreadsheet");
      return;
    }

    const key = `${rowIndex}-${colIndex}`;
    const oldValue = cells[key]?.value || '';
    
    // Save to history
    if (historyIndex < history.length - 1) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), { ...cells }]);
    } else {
      setHistory(prev => [...prev, { ...cells }]);
    }
    setHistoryIndex(prev => prev + 1);

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

    // Mark as pending change (will save when user clicks Save)
    setPendingChanges(prev => new Set(prev).add(key));
    
    // Log activity
    if (oldValue !== displayValue) {
      const { data: { user } } = await supabase.auth.getUser();
      const columnLabel = String.fromCharCode(65 + colIndex);
      
      await supabase.from('activity_log').insert({
        spreadsheet_id: spreadsheetId,
        user_id: user?.id,
        action: `Edited cell ${columnLabel}${rowIndex + 1}`,
        row_index: rowIndex,
        col_index: colIndex,
        old_value: oldValue,
        new_value: displayValue
      });
      
      loadActivityLog();
    }
    
    onCellUpdate?.();
  };

  const savePendingChanges = async () => {
    if (!canEdit || pendingChanges.size === 0) return;

    const changesToSave = Array.from(pendingChanges).map(key => {
      const [rowIndex, colIndex] = key.split('-').map(Number);
      const cell = cells[key];
      return {
        key,
        rowIndex,
        colIndex,
        cell
      };
    });

    for (const { key, rowIndex, colIndex, cell } of changesToSave) {
      const cellId = cell?.id;
      
      if (cellId) {
        await supabase
          .from('cells')
          .update({ 
            value: cell.value, 
            formula: cell.formula?.startsWith('=') ? cell.formula : null 
          })
          .eq('id', cellId);
      } else {
        const { data } = await supabase
          .from('cells')
          .insert({
            spreadsheet_id: spreadsheetId,
            row_index: rowIndex,
            col_index: colIndex,
            value: cell.value,
            formula: cell.formula?.startsWith('=') ? cell.formula : null
          })
          .select()
          .single();

        if (data) {
          setCells(prev => ({
            ...prev,
            [key]: { ...prev[key], id: data.id }
          }));
        }
      }
    }

    setPendingChanges(new Set());
    await onSave?.();
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCells(history[historyIndex - 1]);
      setPendingChanges(prev => {
        const newSet = new Set(prev);
        Object.keys(cells).forEach(key => newSet.add(key));
        return newSet;
      });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCells(history[historyIndex + 1]);
      setPendingChanges(prev => {
        const newSet = new Set(prev);
        Object.keys(cells).forEach(key => newSet.add(key));
        return newSet;
      });
    }
  };

  const deleteRow = async (rowIndex: number) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete rows");
      return;
    }

    const cellsToDelete = Object.keys(cells).filter(key => 
      parseInt(key.split('-')[0]) === rowIndex
    );

    for (const key of cellsToDelete) {
      const cellId = cells[key]?.id;
      if (cellId) {
        await supabase.from('cells').delete().eq('id', cellId);
      }
    }

    loadCells();
    toast.success("Row deleted");
  };

  const deleteColumn = async (colIndex: number) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete columns");
      return;
    }

    const cellsToDelete = Object.keys(cells).filter(key => 
      parseInt(key.split('-')[1]) === colIndex
    );

    for (const key of cellsToDelete) {
      const cellId = cells[key]?.id;
      if (cellId) {
        await supabase.from('cells').delete().eq('id', cellId);
      }
    }

    loadCells();
    toast.success("Column deleted");
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
          value: cells[key]?.value || ''
        })
        .select()
        .single();
      
      cellId = data?.id;
      
      if (cellId) {
        setCells(prev => ({
          ...prev,
          [key]: { ...prev[key], id: cellId }
        }));
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('comments')
      .insert({
        cell_id: cellId,
        user_id: user?.id,
        comment: comment.trim()
      });

    if (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return;
    }

    toast.success("Comment added");
    setComment("");
    setSelectedCell(null);
    
    // Reload cells to get updated comments
    await loadCells();
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
    <div className="space-y-6">
      <div className="inline-block min-w-full">
        {/* Toolbar */}
        <div className="mb-4 flex gap-2 items-center">
          <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0 || !canEdit}
        >
          <Undo className="w-4 h-4 mr-2" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1 || !canEdit}
        >
          <Redo className="w-4 h-4 mr-2" />
          Redo
        </Button>
        {pendingChanges.size > 0 && (
          <span className="text-sm text-muted-foreground ml-4">
            {pendingChanges.size} unsaved {pendingChanges.size === 1 ? 'change' : 'changes'}
          </span>
        )}
        {onSave && (
          <Button
            variant="default"
            size="sm"
            onClick={savePendingChanges}
            disabled={pendingChanges.size === 0 || !canEdit}
            className="ml-auto"
          >
            Save Changes
          </Button>
        )}
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Column Headers */}
        <div className="flex sticky top-0 z-10 bg-secondary">
          <div className="w-12 h-10 border-r border-b border-border flex items-center justify-center text-xs font-medium bg-secondary" />
          {columnLabels.map((label, colIndex) => (
            <div
              key={label}
              className="w-32 h-10 border-r border-b border-border flex items-center justify-center text-sm font-medium group relative"
            >
              <span 
                className="cursor-pointer hover:text-primary"
                onClick={() => handleSort(colIndex)}
              >
                {label}
                {sortConfig?.col === colIndex && (
                  <span className="ml-1 text-xs">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 h-full px-1 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteColumn(colIndex)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex hover:bg-accent/5 group">
            {/* Row Number */}
            <div className="w-12 h-10 border-r border-b border-border flex items-center justify-center text-xs font-medium bg-secondary relative">
              <span>{rowIndex + 1}</span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 h-full px-1 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteRow(rowIndex)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              )}
            </div>
            {/* Cells */}
            {Array.from({ length: cols }, (_, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              const cell = cells[key];
              const cellValue = cell?.value || '';
              const hasComments = cell?.comments && cell.comments.length > 0;
              
              return (
                <TooltipProvider key={key}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-32 h-10 border-r border-b border-border relative group ${hasComments ? 'bg-primary/5' : ''}`}
                      >
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className="w-full h-full px-2 bg-transparent focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:z-10 relative"
                          placeholder=""
                          disabled={!canEdit}
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setSelectedCell(key)}
                            >
                              <MessageSquarePlus className={`w-3 h-3 ${hasComments ? 'text-primary' : ''}`} />
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
                    </TooltipTrigger>
                    {hasComments && (
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          {cell.comments?.map((c) => (
                            <div key={c.id} className="text-xs">
                              <p className="font-medium">{new Date(c.created_at).toLocaleDateString()}</p>
                              <p className="text-muted-foreground">{c.comment}</p>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
        </div>

        {/* Notes Section */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Notes</h3>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => saveNotes(notes)}
            placeholder="Add notes about this spreadsheet..."
            rows={4}
            disabled={!canEdit}
            className="resize-none"
          />
        </div>

        {/* Activity Log */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Recent Activity</h3>
          </div>
          <ScrollArea className="h-32">
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activityLog.map((log) => (
                  <div key={log.id} className="text-xs flex flex-col gap-1 pb-2 border-b border-border last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="font-semibold text-primary">{log.user_name}</span>
                        <span className="text-muted-foreground"> {log.action}</span>
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                        {new Date(log.created_at).toLocaleString([], { 
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    {log.old_value !== null && log.new_value !== null && log.old_value !== log.new_value && (
                      <div className="text-[11px] ml-0 bg-muted/30 px-2 py-1 rounded">
                        <span className="text-destructive line-through">{log.old_value || '(empty)'}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="text-primary font-medium">{log.new_value}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
});

SpreadsheetGrid.displayName = 'SpreadsheetGrid';

export default SpreadsheetGrid;
