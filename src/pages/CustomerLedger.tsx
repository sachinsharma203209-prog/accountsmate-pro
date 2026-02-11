import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Math.abs(amount));
}

export default function CustomerLedger() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState<"debit" | "credit">("debit");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    short_description: "",
    long_description: "",
    amount: "",
    payment_mode: "Cash",
    notes: "",
  });

  const { data: customer } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["ledger", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_entries")
        .select("*")
        .eq("customer_id", id!)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(form.amount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("ledger_entries").insert({
        customer_id: id!,
        date: form.date,
        short_description: form.short_description.trim(),
        long_description: form.long_description.trim() || null,
        debit: entryType === "debit" ? amount : 0,
        credit: entryType === "credit" ? amount : 0,
        payment_mode: form.payment_mode,
        notes: form.notes.trim() || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger", id] });
      qc.invalidateQueries({ queryKey: ["ledger-all"] });
      setOpen(false);
      setForm({ date: new Date().toISOString().split("T")[0], short_description: "", long_description: "", amount: "", payment_mode: "Cash", notes: "" });
      toast({ title: "Entry added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await supabase.from("activity_logs").insert({
        action: "DELETE",
        entity_type: "ledger_entry",
        entity_id: entryId,
        performed_by: user!.id,
      });
      const { error } = await supabase.from("ledger_entries").delete().eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger", id] });
      qc.invalidateQueries({ queryKey: ["ledger-all"] });
      toast({ title: "Entry deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalDebit = entries?.reduce((s, e) => s + Number(e.debit), 0) ?? 0;
  const totalCredit = entries?.reduce((s, e) => s + Number(e.credit), 0) ?? 0;
  const currentBalance = (customer?.opening_balance ?? 0) + totalCredit - totalDebit;

  // Running balance
  let runningBalance = customer?.opening_balance ?? 0;

  return (
    <AppLayout>
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate("/customers")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Customers
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">{customer?.name ?? "..."}</h1>
            <p className="page-description">{customer?.mobile} · {customer?.address}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Entry</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Ledger Entry</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={entryType === "debit" ? "default" : "outline"}
                    onClick={() => setEntryType("debit")}
                    className={entryType === "debit" ? "bg-destructive hover:bg-destructive/90" : ""}
                  >
                    Debit (Udhar)
                  </Button>
                  <Button
                    type="button"
                    variant={entryType === "credit" ? "default" : "outline"}
                    onClick={() => setEntryType("credit")}
                    className={entryType === "credit" ? "bg-success hover:bg-success/90" : ""}
                  >
                    Credit (Jama)
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Short Description *</Label>
                  <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="e.g. Payment received" />
                </div>
                <div className="space-y-2">
                  <Label>Details</Label>
                  <Textarea value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} placeholder="Optional details..." />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  className="w-full"
                  disabled={!form.short_description.trim() || !form.amount}
                >
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit (Udhar)</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold balance-negative">{formatCurrency(totalDebit)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit (Jama)</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold balance-positive">{formatCurrency(totalCredit)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${currentBalance >= 0 ? "balance-positive" : "balance-negative"}`}>
              {currentBalance >= 0 ? "+" : "-"}{formatCurrency(currentBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {!entries || entries.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No entries yet. Add your first transaction above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium text-right">Debit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Credit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Balance</th>
                    <th className="pb-3 pr-4 font-medium">Mode</th>
                    {isAdmin && <th className="pb-3 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  <tr className="border-b bg-muted/50">
                    <td className="py-3 pr-4 font-medium">—</td>
                    <td className="py-3 pr-4 font-medium">Opening Balance</td>
                    <td className="py-3 pr-4 text-right">—</td>
                    <td className="py-3 pr-4 text-right">—</td>
                    <td className={`py-3 pr-4 text-right font-semibold ${(customer?.opening_balance ?? 0) >= 0 ? "balance-positive" : "balance-negative"}`}>
                      {formatCurrency(customer?.opening_balance ?? 0)}
                    </td>
                    <td className="py-3 pr-4">—</td>
                    {isAdmin && <td></td>}
                  </tr>
                  {entries.map((e) => {
                    runningBalance = runningBalance + Number(e.credit) - Number(e.debit);
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">{e.date}</td>
                        <td className="py-3 pr-4">
                          <span className="font-medium">{e.short_description}</span>
                          {e.long_description && <p className="text-xs text-muted-foreground mt-0.5">{e.long_description}</p>}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {Number(e.debit) > 0 ? <span className="balance-negative">{formatCurrency(Number(e.debit))}</span> : "—"}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {Number(e.credit) > 0 ? <span className="balance-positive">{formatCurrency(Number(e.credit))}</span> : "—"}
                        </td>
                        <td className={`py-3 pr-4 text-right font-semibold ${runningBalance >= 0 ? "balance-positive" : "balance-negative"}`}>
                          {runningBalance >= 0 ? "+" : "-"}{formatCurrency(runningBalance)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                            {e.payment_mode}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("Delete this entry?")) deleteMutation.mutate(e.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
