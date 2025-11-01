import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, ArrowLeft, Save, Download, Share2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Sheet = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [sheetName, setSheetName] = useState("Untitled Spreadsheet");
  const [isEditingName, setIsEditingName] = useState(false);

  // Create a simple grid (10 rows x 10 columns for now)
  const rows = 20;
  const cols = 10;
  const columnLabels = Array.from({ length: cols }, (_, i) => 
    String.fromCharCode(65 + i)
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
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
  }, [navigate]);

  const handleSave = () => {
    toast.success("Spreadsheet saved successfully!");
  };

  const handleShare = () => {
    toast.info("Sharing features coming soon!");
  };

  const handleDownload = () => {
    toast.info("Export features coming soon!");
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
          <div className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm">
              <strong>B</strong>
            </Button>
            <Button variant="ghost" size="sm">
              <em>I</em>
            </Button>
            <Button variant="ghost" size="sm">
              <span className="underline">U</span>
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

      {/* Spreadsheet Grid */}
      <main className="flex-1 overflow-auto p-4 bg-muted/20">
        <div className="inline-block min-w-full">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            {/* Column Headers */}
            <div className="flex sticky top-0 z-10 bg-secondary">
              <div className="w-12 h-10 border-r border-b border-border flex items-center justify-center text-xs font-medium bg-secondary" />
              {columnLabels.map((label) => (
                <div
                  key={label}
                  className="w-32 h-10 border-r border-b border-border flex items-center justify-center text-sm font-medium"
                >
                  {label}
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
                {Array.from({ length: cols }, (_, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-32 h-10 border-r border-b border-border"
                  >
                    <input
                      type="text"
                      className="w-full h-full px-2 bg-transparent focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:z-10 relative"
                      placeholder=""
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Formula Bar */}
      <div className="border-t border-border bg-card p-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-16">fx</span>
          <Input 
            placeholder="Enter formula or value..." 
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};

export default Sheet;
