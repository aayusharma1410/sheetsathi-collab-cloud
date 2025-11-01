import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Table, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Templates = () => {
  const navigate = useNavigate();

  const templates = [
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

  const createFromTemplate = async (template: typeof templates[0]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Create spreadsheet
      const { data: spreadsheet, error: sheetError } = await supabase
        .from('spreadsheets')
        .insert({
          user_id: user.id,
          name: template.name,
          is_template: false
        })
        .select()
        .single();

      if (sheetError) throw sheetError;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose a Template</h1>
          <p className="text-muted-foreground">
            Start with a pre-built template to get going faster
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => createFromTemplate(template)}
            >
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
                <Button className="w-full">
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;
