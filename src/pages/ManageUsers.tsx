import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserCog, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

export default function ManageUsers() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" as "admin" | "staff" });

  const { data: profiles, refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setCreating(true);
    try {
      // Use edge function to create user (admin only)
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          role: form.role,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "staff" });
      refetch();
      toast({ title: "User created successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  return (
    <AppLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-description">{profiles?.length ?? 0} registered users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v: "admin" | "staff") => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={creating || !form.name.trim() || !form.email.trim() || form.password.length < 6}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles?.map((p) => (
          <Card key={p.id} className="stat-card animate-fade-in">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base font-semibold truncate">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground truncate">{p.email}</p>
              </div>
            </CardHeader>
            <CardContent>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                p.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
              }`}>
                {p.role.charAt(0).toUpperCase() + p.role.slice(1)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
