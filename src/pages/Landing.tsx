import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, Users, Zap, Lock, Cloud, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Cloud className="w-12 h-12 text-primary" />,
      title: "Cloud-Based",
      description: "Access your spreadsheets from anywhere, anytime. Auto-save keeps your work safe.",
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Real-Time Collaboration",
      description: "Work together seamlessly with live cursors and instant updates.",
    },
    {
      icon: <Zap className="w-12 h-12 text-primary" />,
      title: "Powerful Formulas",
      description: "Support for SUM, AVERAGE, COUNT, IF, VLOOKUP and more.",
    },
    {
      icon: <Lock className="w-12 h-12 text-primary" />,
      title: "Secure Sharing",
      description: "Control access with view-only and edit permissions.",
    },
    {
      icon: <FileSpreadsheet className="w-12 h-12 text-primary" />,
      title: "Import & Export",
      description: "Work with CSV and XLSX files seamlessly.",
    },
    {
      icon: <History className="w-12 h-12 text-primary" />,
      title: "Version History",
      description: "Track changes and restore previous versions anytime.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SheetSathi
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                Collaborate on
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {" "}
                  Spreadsheets{" "}
                </span>
                in Real-Time
              </h2>
              <p className="text-xl text-muted-foreground">
                The lightweight, fast, and intuitive spreadsheet platform for teams.
                Create, share, and collaborate on data without limits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="group"
                >
                  Start for Free
                  <Zap className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/templates")}>
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-accent rounded-2xl blur-2xl opacity-20" />
              <img
                src={heroImage}
                alt="SheetSathi Workspace"
                className="relative rounded-2xl shadow-2xl border border-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-4xl font-bold">Everything you need to collaborate</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for small teams managing budgets, inventories, and data with simplicity and speed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto space-y-8">
            <h3 className="text-4xl lg:text-5xl font-bold">
              Ready to get started?
            </h3>
            <p className="text-xl text-muted-foreground">
              Join thousands of teams already collaborating with SheetSathi.
              No credit card required.
            </p>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="text-lg px-12"
            >
              Create Your First Sheet
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <span className="font-semibold">SheetSathi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SheetSathi. Making collaboration simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
