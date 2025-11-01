import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator } from "lucide-react";

const Shortcuts = () => {
  const navigate = useNavigate();

  const formulas = [
    {
      name: 'SUM',
      syntax: '=SUM(A1:A10)',
      description: 'Adds all numbers in a range',
      example: '=SUM(A1:A5) adds values from A1 to A5'
    },
    {
      name: 'AVERAGE',
      syntax: '=AVERAGE(A1:A10)',
      description: 'Calculates the average of numbers',
      example: '=AVERAGE(B1:B10) finds average of B1 to B10'
    },
    {
      name: 'COUNT',
      syntax: '=COUNT(A1:A10)',
      description: 'Counts non-empty cells in a range',
      example: '=COUNT(C1:C20) counts filled cells'
    },
    {
      name: 'MIN / MAX',
      syntax: '=MIN(A1:A10) / =MAX(A1:A10)',
      description: 'Find minimum or maximum value',
      example: '=MIN(A1:A10) or =MAX(B1:B10)'
    },
    {
      name: 'PRODUCT',
      syntax: '=PRODUCT(A1:A5)',
      description: 'Multiplies all numbers in a range',
      example: '=PRODUCT(A1:A3) multiplies A1*A2*A3'
    },
    {
      name: 'ROUND',
      syntax: '=ROUND(A1,2)',
      description: 'Rounds to specified decimal places',
      example: '=ROUND(3.14159,2) returns 3.14'
    },
    {
      name: 'IF',
      syntax: '=IF(A1>0,"Yes","No")',
      description: 'Conditional logic',
      example: '=IF(B1>100,"High","Low")'
    },
    {
      name: 'VLOOKUP',
      syntax: '=VLOOKUP("value",A1:B10,2)',
      description: 'Look up value in table',
      example: '=VLOOKUP("Apple",A1:C10,3)'
    },
    {
      name: 'ABS',
      syntax: '=ABS(A1)',
      description: 'Absolute value',
      example: '=ABS(-5) returns 5'
    },
    {
      name: 'SQRT',
      syntax: '=SQRT(A1)',
      description: 'Square root',
      example: '=SQRT(16) returns 4'
    },
    {
      name: 'POWER',
      syntax: '=POWER(A1,2)',
      description: 'Raise to power',
      example: '=POWER(5,2) returns 25'
    },
    {
      name: 'MOD',
      syntax: '=MOD(A1,2)',
      description: 'Remainder after division',
      example: '=MOD(10,3) returns 1'
    },
    {
      name: 'CEILING',
      syntax: '=CEILING(A1)',
      description: 'Round up to nearest integer',
      example: '=CEILING(3.2) returns 4'
    },
    {
      name: 'FLOOR',
      syntax: '=FLOOR(A1)',
      description: 'Round down to nearest integer',
      example: '=FLOOR(3.8) returns 3'
    },
    {
      name: 'Basic Math',
      syntax: '=A1+B1',
      description: 'Perform arithmetic operations',
      example: '=A1*B1-C1 for multiply and subtract'
    }
  ];

  const keyboardShortcuts = [
    { key: 'Enter', action: 'Confirm cell input and move down' },
    { key: 'Tab', action: 'Move to next cell (right)' },
    { key: 'Shift + Tab', action: 'Move to previous cell (left)' },
    { key: 'Arrow Keys', action: 'Navigate between cells' },
    { key: 'Ctrl/Cmd + S', action: 'Save spreadsheet' },
    { key: 'Ctrl/Cmd + C', action: 'Copy cell content' },
    { key: 'Ctrl/Cmd + V', action: 'Paste cell content' },
  ];

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
          <h1 className="text-3xl font-bold mb-2">Formulas & Shortcuts</h1>
          <p className="text-muted-foreground">
            Learn how to use formulas and keyboard shortcuts
          </p>
        </div>

        <div className="grid gap-8">
          {/* Formulas Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Common Formulas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulas.map((formula) => (
                <Card key={formula.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{formula.name}</CardTitle>
                    <CardDescription className="font-mono text-sm">
                      {formula.syntax}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{formula.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Example: <code className="bg-muted px-1 py-0.5 rounded">{formula.example}</code>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Keyboard Shortcuts</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="font-mono text-sm bg-muted px-3 py-1 rounded">
                        {shortcut.key}
                      </span>
                      <span className="text-sm text-muted-foreground flex-1 ml-4">
                        {shortcut.action}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shortcuts;
