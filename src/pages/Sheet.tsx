import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, ArrowLeft, Save, Download, Share2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import { exportToCSV } from "@/lib/exportUtils";

const Sheet = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [sheetName, setSheetName] = useState("Untitled Spreadsheet");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState("");

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
    if (!id) return;

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
  };

  const handleSave = async () => {
    if (!id) return;

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                {isEditingName ? (
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
                  <h1 
                    className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingName(true)}
                  >
                    {sheetName}
                  </h1>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm">
                <Users className="w-4 h-4 mr-2" />
                0 online
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => insertFormula('=SUM(A1:A10)')}
            >
              SUM
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => insertFormula('=AVERAGE(A1:A10)')}
            >
              AVG
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => insertFormula('=COUNT(A1:A10)')}
            >
              COUNT
            </Button>
            <div className="h-6 w-px bg-border mx-1" />
            <select className="h-8 px-2 rounded-md border border-input bg-background text-sm">
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
            </select>
            <select className="h-8 px-2 rounded-md border border-input bg-background text-sm">
              <option>10</option>
              <option>12</option>
              <option>14</option>
              <option>16</option>
            </select>
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
      <main className="flex-1 overflow-auto p-4 bg-muted/20">
        {id && (
          <SpreadsheetGrid 
            spreadsheetId={id}
            rows={rows}
            cols={cols}
            onCellUpdate={handleSave}
          />
        )}
      </main>
    </div>
  );
};

export default Sheet;
