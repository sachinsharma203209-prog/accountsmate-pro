import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, BookOpen, Trash2, Edit, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Math.abs(amount));
}

export default function Customers() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", mobile: "", address: "", opening_balance: "0" });

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: ledgerEntries } = useQuery({
    queryKey: ["ledger-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ledger_entries").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("customers").insert({
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        address: values.address.trim() || null,
        opening_balance: parseFloat(values.opening_balance) || 0,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setForm({ name: "", mobile: "", address: "", opening_balance: "0" });
      toast({ title: "Customer created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form & { id: string }) => {
      const { error } = await supabase.from("customers").update({
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        address: values.address.trim() || null,
        opening_balance: parseFloat(values.opening_balance) || 0,
      }).eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setEditCustomer(null);
      toast({ title: "Customer updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("activity_logs").insert({
        action: "DELETE",
        entity_type: "customer",
        entity_id: id,
        performed_by: user!.id,
      });
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = customers?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  ) ?? [];

  const getBalance = (customerId: string, openingBalance: number) => {
    const entries = ledgerEntries?.filter((e) => e.customer_id === customerId) ?? [];
    const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);
    const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
    return openingBalance + totalCredit - totalDebit;
  };

  const CustomerForm = ({ onSubmit, initial, title }: { onSubmit: (v: typeof form) => void; initial: typeof form; title: string }) => {
    const [localForm, setLocalForm] = useState(initial);
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input value={localForm.name} onChange={(e) => setLocalForm({ ...localForm, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Mobile *</Label>
          <Input value={localForm.mobile} onChange={(e) => setLocalForm({ ...localForm, mobile: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea value={localForm.address} onChange={(e) => setLocalForm({ ...localForm, address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Opening Balance (₹)</Label>
          <Input type="number" value={localForm.opening_balance} onChange={(e) => setLocalForm({ ...localForm, opening_balance: e.target.value })} />
        </div>
        <Button onClick={() => onSubmit(localForm)} className="w-full" disabled={!localForm.name.trim() || !localForm.mobile.trim()}>
          {title}
        </Button>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-description">{customers?.length ?? 0} total customers</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
              <CustomerForm
                initial={{ name: "", mobile: "", address: "", opening_balance: "0" }}
                onSubmit={(v) => createMutation.mutate(v)}
                title="Create Customer"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No customers found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const balance = getBalance(c.id, c.opening_balance);
            return (
              <Card key={c.id} className="stat-card cursor-pointer animate-fade-in group" onClick={() => navigate(`/customers/${c.id}`)}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold truncate">{c.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{c.mobile}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditCustomer(c);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this customer?")) deleteMutation.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className={balance >= 0 ? "balance-positive text-lg" : "balance-negative text-lg"}>
                      {balance >= 0 ? "+" : "-"}{formatCurrency(balance)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editCustomer} onOpenChange={(v) => !v && setEditCustomer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          {editCustomer && (
            <CustomerForm
              initial={{
                name: editCustomer.name,
                mobile: editCustomer.mobile,
                address: editCustomer.address || "",
                opening_balance: String(editCustomer.opening_balance),
              }}
              onSubmit={(v) => updateMutation.mutate({ ...v, id: editCustomer.id })}
              title="Update Customer"
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
