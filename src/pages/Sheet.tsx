import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, ArrowLeft, Save, Download, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import { ShareDialog } from "@/components/ShareDialog";
import { AccessCodeDialog } from "@/components/AccessCodeDialog";
import { exportToCSV } from "@/lib/exportUtils";

const Sheet = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [sheetName, setSheetName] = useState("Untitled Spreadsheet");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const gridRef = useRef<any>(null);

  const rows = 20;
  const cols = 10;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      loadSpreadsheet();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        } else if (session) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, id]);

  const loadSpreadsheet = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('spreadsheets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Failed to load spreadsheet");
      return;
    }

    setSheetName(data.name);
    setAccessCode(data.access_code);
    setIsOwner(data.user_id === user.id);

    // Check if user is owner
    if (data.user_id === user.id) {
      setCanEdit(true);
      return;
    }

    // Check if user has edit permission
    const { data: permission } = await supabase
      .from('spreadsheet_permissions')
      .select('permission_level')
      .eq('spreadsheet_id', id)
      .eq('user_id', user.id)
      .single();

    if (permission?.permission_level === 'edit') {
      setCanEdit(true);
      return;
    }

    // If spreadsheet has access code, show dialog
    if (data.access_code && !permission) {
      setShowAccessDialog(true);
    }
  };

  const handleAccessCodeSubmit = (code: string) => {
    if (code === accessCode) {
      setCanEdit(true);
      setShowAccessDialog(false);
      toast.success("Access granted! You can now edit this spreadsheet.");
    } else {
      toast.error("Incorrect access code");
    }
  };

  const handleAccessCodeSkip = () => {
    setShowAccessDialog(false);
    setCanEdit(false);
    toast.info("Viewing in read-only mode");
  };

  const handleSave = async () => {
    if (!id || !canEdit) return;

    // Save grid changes first
    if (gridRef.current?.savePendingChanges) {
      await gridRef.current.savePendingChanges();
    }

    const { error } = await supabase
      .from('spreadsheets')
      .update({ 
        name: sheetName,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast.error("Failed to save");
      return;
    }

    toast.success("Spreadsheet saved successfully!");
  };


  const handleDownload = async () => {
    if (!id) return;

    const { data } = await supabase
      .from('cells')
      .select('*')
      .eq('spreadsheet_id', id);

    if (!data) return;

    const cellsData = data.map(cell => ({
      row: cell.row_index,
      col: cell.col_index,
      value: cell.value || ''
    }));

    exportToCSV(cellsData, rows, cols, sheetName);
    toast.success("Exported successfully!");
  };

  const insertFormula = (formula: string) => {
    setSelectedFormula(formula);
    toast.info(`Click a cell and type: ${formula}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <AccessCodeDialog
        open={showAccessDialog}
        onSubmit={handleAccessCodeSubmit}
        onSkip={handleAccessCodeSkip}
        spreadsheetName={sheetName}
      />
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                {isEditingName && canEdit ? (
                  <Input
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingName(false);
                    }}
                    className="w-64 h-8"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 
                      className={`text-lg font-semibold ${canEdit ? 'cursor-pointer hover:text-primary' : ''} transition-colors`}
                      onClick={() => canEdit && setIsEditingName(true)}
                    >
                      {sheetName}
                    </h1>
                    {!canEdit && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && id && (
                <ShareDialog spreadsheetId={id} spreadsheetName={sheetName} />
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {canEdit && (
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=SUM(A1:A10)')}>SUM</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=AVERAGE(A1:A10)')}>AVG</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=COUNT(A1:A10)')}>COUNT</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=MIN(A1:A10)')}>MIN</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=MAX(A1:A10)')}>MAX</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=PRODUCT(A1:A10)')}>PRODUCT</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=ROUND(A1,2)')}>ROUND</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=IF(A1>0,"Yes","No")')}>IF</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=VLOOKUP("value",A1:B10,2)')}>VLOOKUP</Button>
          </div>
        </div>
      </header>

      {/* Formula Bar */}
      <div className="border-b border-border bg-card p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-16">fx</span>
          <Input 
            placeholder="Enter formula or value..." 
            className="flex-1"
            value={selectedFormula}
            onChange={(e) => setSelectedFormula(e.target.value)}
          />
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <main className="flex-1 overflow-auto p-6">
        {id && (
          <SpreadsheetGrid 
            ref={gridRef}
            spreadsheetId={id}
            rows={rows}
            cols={cols}
            onCellUpdate={() => {}}
            canEdit={canEdit}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
};

export default Sheet;
