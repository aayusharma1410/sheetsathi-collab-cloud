import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ShareDialogProps = {
  spreadsheetId: string;
  spreadsheetName: string;
};

export const ShareDialog = ({ spreadsheetId, spreadsheetName }: ShareDialogProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = `${window.location.origin}/sheet/${spreadsheetId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Find user by email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .single();

    if (!profiles) {
      toast.error("User not found with this email");
      return;
    }

    // Add permission
    const { error } = await supabase
      .from('spreadsheet_permissions')
      .insert({
        spreadsheet_id: spreadsheetId,
        user_id: profiles.id,
        permission_level: permission
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("User already has access to this spreadsheet");
      } else {
        toast.error("Failed to share spreadsheet");
      }
      return;
    }

    toast.success(`Spreadsheet shared with ${email}`);
    setEmail("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{spreadsheetName}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the spreadsheet
            </p>
          </div>

          <div className="space-y-2">
            <Label>Share with specific user</Label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Can view</SelectItem>
                <SelectItem value="edit">Can edit</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleShare} className="w-full">
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
