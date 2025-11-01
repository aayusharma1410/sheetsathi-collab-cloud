import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, ArrowLeft, Plus, Lock, Table, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Templates = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [customAccessCode, setCustomAccessCode] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);

  const prebuiltTemplates = [
    {
      id: 'budget',
      name: 'Monthly Budget Sheet',
      description: 'Track your income and expenses with predefined categories',
      icon: Table,
      data: {
        cells: [
          { row: 0, col: 0, value: 'Category' },
          { row: 0, col: 1, value: 'Planned' },
          { row: 0, col: 2, value: 'Actual' },
          { row: 0, col: 3, value: 'Difference' },
          { row: 1, col: 0, value: 'Income' },
          { row: 2, col: 0, value: 'Housing' },
          { row: 3, col: 0, value: 'Food' },
          { row: 4, col: 0, value: 'Transportation' },
          { row: 5, col: 0, value: 'Entertainment' },
          { row: 6, col: 0, value: 'Savings' },
        ]
      }
    },
    {
      id: 'task-tracker',
      name: 'Task Tracker',
      description: 'Organize tasks with status, priority, and deadlines',
      icon: ListChecks,
      data: {
        cells: [
          { row: 0, col: 0, value: 'Task' },
          { row: 0, col: 1, value: 'Status' },
          { row: 0, col: 2, value: 'Priority' },
          { row: 0, col: 3, value: 'Due Date' },
          { row: 0, col: 4, value: 'Assigned To' },
          { row: 1, col: 0, value: 'Example Task 1' },
          { row: 1, col: 1, value: 'In Progress' },
          { row: 1, col: 2, value: 'High' },
          { row: 2, col: 0, value: 'Example Task 2' },
          { row: 2, col: 1, value: 'Pending' },
          { row: 2, col: 2, value: 'Medium' },
        ]
      }
    }
  ];

  useEffect(() => {
    checkAuth();
    loadUserTemplates();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
  };

  const loadUserTemplates = async () => {
    const { data } = await supabase
      .from('spreadsheets')
      .select('*')
      .eq('is_template', true)
      .order('created_at', { ascending: false });

    setUserTemplates(data || []);
  };

  const createFromPrebuiltTemplate = async (template: typeof prebuiltTemplates[0]) => {
    if (!user) return;

    try {
      // Create spreadsheet
      const { data: spreadsheet, error: sheetError } = await supabase
        .from('spreadsheets')
        .insert({
          user_id: user.id,
          name: template.name,
          is_template: false
        })
        .select()
        .maybeSingle();

      if (sheetError) {
        console.error('Error creating spreadsheet:', sheetError);
        throw sheetError;
      }

      if (!spreadsheet) {
        throw new Error('No spreadsheet returned');
      }

      // Insert template cells
      const cellsToInsert = template.data.cells.map(cell => ({
        spreadsheet_id: spreadsheet.id,
        row_index: cell.row,
        col_index: cell.col,
        value: cell.value
      }));

      const { error: cellsError } = await supabase
        .from('cells')
        .insert(cellsToInsert);

      if (cellsError) throw cellsError;

      toast.success("Template created successfully!");
      navigate(`/sheet/${spreadsheet.id}`);
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error("Failed to create from template");
    }
  };

  const createCustomTemplate = async () => {
    if (!user || !customTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('spreadsheets')
        .insert({
          name: customTemplateName,
          user_id: user.id,
          is_template: true,
          is_public: true,
          access_code: customAccessCode.trim() || null
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating template:', error);
        toast.error("Failed to create template");
        return;
      }

      if (!data) {
        toast.error("Failed to create template");
        return;
      }

      toast.success("Template created! Redirecting to edit...");
      setIsDialogOpen(false);
      setCustomTemplateName("");
      setCustomAccessCode("");
      navigate(`/sheet/${data.id}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error("Failed to create template");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Templates
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Your Own Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      placeholder="My Custom Template"
                      value={customTemplateName}
                      onChange={(e) => setCustomTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-code">Access Code (Optional)</Label>
                    <Input
                      id="access-code"
                      type="password"
                      placeholder="Leave empty for public access"
                      value={customAccessCode}
                      onChange={(e) => setCustomAccessCode(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Users will need this code to edit your template
                    </p>
                  </div>
                  <Button onClick={createCustomTemplate} className="w-full">
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pre-made Templates</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prebuiltTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-xl hover:scale-105 transition-all duration-200 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <template.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{template.name}</CardTitle>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => createFromPrebuiltTemplate(template)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {userTemplates.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Community Templates</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-xl hover:scale-105 transition-all duration-200 border-accent/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-accent" />
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.access_code && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <CardDescription>Created by community</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => navigate(`/sheet/${template.id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      View Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Templates;
