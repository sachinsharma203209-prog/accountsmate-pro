import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Math.abs(amount));
}

export default function Dashboard() {
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*");
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

  const totalCustomers = customers?.length ?? 0;

  // Calculate balances per customer
  const customerBalances = customers?.map((c) => {
    const entries = ledgerEntries?.filter((e) => e.customer_id === c.id) ?? [];
    const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);
    const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
    return c.opening_balance + totalCredit - totalDebit;
  }) ?? [];

  const totalOutstanding = customerBalances.filter((b) => b < 0).reduce((s, b) => s + b, 0);
  const totalReceivable = customerBalances.filter((b) => b > 0).reduce((s, b) => s + b, 0);

  const today = new Date().toISOString().split("T")[0];
  const todayTx = ledgerEntries?.filter((e) => e.date === today).length ?? 0;

  const stats = [
    { label: "Total Customers", value: totalCustomers.toString(), icon: Users, color: "text-primary" },
    { label: "Total Outstanding", value: formatCurrency(totalOutstanding), icon: TrendingDown, color: "text-destructive" },
    { label: "Total Receivable", value: formatCurrency(totalReceivable), icon: TrendingUp, color: "text-success" },
    { label: "Today's Transactions", value: todayTx.toString(), icon: Activity, color: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your accounts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="stat-card animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {!ledgerEntries ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : ledgerEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No transactions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Description</th>
                      <th className="pb-3 pr-4 font-medium text-right">Debit</th>
                      <th className="pb-3 pr-4 font-medium text-right">Credit</th>
                      <th className="pb-3 font-medium">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerEntries.slice(0, 10).map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{e.date}</td>
                        <td className="py-3 pr-4">{e.short_description}</td>
                        <td className="py-3 pr-4 text-right">
                          {Number(e.debit) > 0 ? <span className="balance-negative">{formatCurrency(Number(e.debit))}</span> : "—"}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {Number(e.credit) > 0 ? <span className="balance-positive">{formatCurrency(Number(e.credit))}</span> : "—"}
                        </td>
                        <td className="py-3">{e.payment_mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
