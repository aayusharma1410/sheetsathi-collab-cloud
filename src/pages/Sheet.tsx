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
      await loadSpreadsheet(session.user);
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

  // Listen for permission changes in realtime
  useEffect(() => {
    if (!id || !user) return;

    const channel = supabase
      .channel(`permissions-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spreadsheet_permissions',
          filter: `spreadsheet_id=eq.${id}`,
        },
        (payload) => {
          console.log('Permission change detected:', payload);
          // Reload spreadsheet permissions when they change
          loadSpreadsheet(user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  const loadSpreadsheet = async (currentUser?: SupabaseUser) => {
    if (!id) {
      console.log("No spreadsheet ID provided");
      return;
    }
    
    const activeUser = currentUser || user;
    if (!activeUser) {
      console.log("No active user found");
      return;
    }

    console.log("Loading spreadsheet:", id, "for user:", activeUser.id);

    const { data, error } = await supabase
      .from('spreadsheets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error loading spreadsheet:", error);
      toast.error("Failed to load spreadsheet");
      return;
    }

    if (!data) {
      console.log("Spreadsheet not found");
      toast.error("Spreadsheet not found");
      navigate("/dashboard");
      return;
    }

    console.log("Spreadsheet data loaded:", data);
    console.log("Spreadsheet owner:", data.user_id, "Current user:", activeUser.id);

    setSheetName(data.name);
    setAccessCode(data.access_code);
    const isUserOwner = data.user_id === activeUser.id;
    setIsOwner(isUserOwner);

    // Check if user is owner
    if (isUserOwner) {
      console.log("User is owner - granting edit permission");
      setCanEdit(true);
      return;
    }

    // Check if user has edit permission (for shared users)
    const { data: permission, error: permError } = await supabase
      .from('spreadsheet_permissions')
      .select('permission_level')
      .eq('spreadsheet_id', id)
      .eq('user_id', activeUser.id)
      .maybeSingle();

    console.log("Permission check for shared user:", permission, permError);

    if (permission?.permission_level === 'edit') {
      console.log("User has edit permission - granting access");
      setCanEdit(true);
      return;
    }

    if (permission?.permission_level === 'view') {
      console.log("User has view-only permission");
      setCanEdit(false);
      return;
    }

    // If spreadsheet has access code and user has no explicit permission, show dialog
    if (data.access_code && !permission) {
      console.log("Spreadsheet requires access code");
      setShowAccessDialog(true);
      setCanEdit(false);
    } else {
      console.log("User has no access - view-only mode");
      setCanEdit(false);
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
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=ABS(A1)')}>ABS</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=SQRT(A1)')}>SQRT</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=POWER(A1,2)')}>POWER</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=MOD(A1,2)')}>MOD</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=CEILING(A1)')}>CEILING</Button>
            <Button variant="ghost" size="sm" onClick={() => insertFormula('=FLOOR(A1)')}>FLOOR</Button>
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
