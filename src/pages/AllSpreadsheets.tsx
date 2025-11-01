import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const AllSpreadsheets = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    loadSpreadsheets(session.user.id);
  };

  const loadSpreadsheets = async (userId: string) => {
    // Load owned spreadsheets
    const { data: owned, error: ownedError } = await supabase
      .from('spreadsheets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_template', false)
      .order('updated_at', { ascending: false });

    // Load shared spreadsheets
    const { data: permissions } = await supabase
      .from('spreadsheet_permissions')
      .select('spreadsheet_id, spreadsheets(*)')
      .eq('user_id', userId);

    const shared = permissions?.map(p => (p as any).spreadsheets).filter(Boolean) || [];

    if (ownedError) {
      toast.error("Failed to load spreadsheets");
      return;
    }

    setSpreadsheets([...(owned || []), ...shared]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('spreadsheets')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete spreadsheet");
      return;
    }

    toast.success("Spreadsheet deleted");
    loadSpreadsheets(user!.id);
  };

  const createNewSpreadsheet = async () => {
    try {
      const { data, error } = await supabase
        .from('spreadsheets')
        .insert({
          user_id: user!.id,
          name: 'Untitled Spreadsheet'
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating spreadsheet:', error);
        toast.error("Failed to create spreadsheet");
        return;
      }

      if (!data) {
        toast.error("Failed to create spreadsheet");
        return;
      }

      navigate(`/sheet/${data.id}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error("Failed to create spreadsheet");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={createNewSpreadsheet}>
            <Plus className="w-4 h-4 mr-2" />
            New Spreadsheet
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Spreadsheets</h1>
          <p className="text-muted-foreground">
            Manage and organize all your spreadsheets
          </p>
        </div>

        {spreadsheets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No spreadsheets yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first spreadsheet to get started
              </p>
              <Button onClick={createNewSpreadsheet}>
                <Plus className="w-4 h-4 mr-2" />
                Create Spreadsheet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spreadsheets.map((sheet) => (
              <Card 
                key={sheet.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader onClick={() => navigate(`/sheet/${sheet.id}`)}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileSpreadsheet className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="line-clamp-1">{sheet.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Updated {new Date(sheet.updated_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(`/sheet/${sheet.id}`)}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(sheet.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSpreadsheets;
