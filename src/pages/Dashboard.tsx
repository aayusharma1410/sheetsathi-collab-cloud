import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, LogOut, Plus, FileText, Keyboard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-image.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [userName, setUserName] = useState("User");

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
    
    // Load user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single();
    
    if (profile?.display_name) {
      setUserName(profile.display_name);
    } else {
      setUserName(session.user.email?.split('@')[0] || 'User');
    }

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
  };

  const loadSpreadsheets = async (userId: string) => {
    const { data, error } = await supabase
      .from('spreadsheets')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (error) {
      toast.error("Failed to load spreadsheets");
      return;
    }

    setSpreadsheets(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto text-center relative z-10">
          <div className="mb-6">
            <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Welcome back, {userName}!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Your collaborative spreadsheet workspace
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={createNewSpreadsheet}
          >
            <CardHeader>
              <Plus className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">New Spreadsheet</CardTitle>
              <CardDescription>Start from scratch</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/templates')}
          >
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Templates</CardTitle>
              <CardDescription>Use pre-built templates</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/all-spreadsheets')}
          >
            <CardHeader>
              <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">All Spreadsheets</CardTitle>
              <CardDescription>View all your files</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/shortcuts')}
          >
            <CardHeader>
              <Keyboard className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">Shortcuts</CardTitle>
              <CardDescription>Formulas & tips</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Spreadsheets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Spreadsheets</h2>
            <Button variant="ghost" onClick={() => navigate('/all-spreadsheets')}>
              View All
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {spreadsheets.map((sheet) => (
                <Card 
                  key={sheet.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/sheet/${sheet.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-base line-clamp-1">{sheet.name}</CardTitle>
                    </div>
                    <CardDescription>
                      Updated {new Date(sheet.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="text-center">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
