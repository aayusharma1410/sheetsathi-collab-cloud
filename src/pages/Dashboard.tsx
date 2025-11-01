import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setIsLoading(false);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const handleCreateSheet = () => {
    navigate("/sheet/new");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SheetSathi
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">My Spreadsheets</h2>
            <p className="text-muted-foreground">
              Create and manage your collaborative spreadsheets
            </p>
          </div>

          {/* Create New Sheet Card */}
          <div className="grid gap-6">
            <button
              onClick={handleCreateSheet}
              className="group relative overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary transition-all duration-300 p-12 bg-card hover:bg-accent/5"
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                    Create New Spreadsheet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start collaborating with your team
                  </p>
                </div>
              </div>
            </button>

            {/* Placeholder for existing sheets */}
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>You don't have any spreadsheets yet.</p>
              <p className="text-sm">Create your first one to get started!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
