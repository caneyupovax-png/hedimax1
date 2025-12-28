"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Withdrawal = {
  id: string;
  user_id: string;
  coin: string;
  address: string;
  amount: number;
  status: string | null;
  reject_reason: string | null;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr("");

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      router.push("/login");
      return;
    }

    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin_user");
    if (adminErr || !isAdmin) {
      setErr("Yetkisiz erişim");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .select("id,user_id,coin,address,amount,status,reject_reason,created_at")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    setRows((data as Withdrawal[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setErr("");
    const { error } = await supabase.rpc("admin_approve_withdrawal", { p_id: id });
    if (error) setErr(error.message);
    await load();
    setBusyId(null);
  }

  async function reject(id: string) {
    const reason = prompt("Red nedeni (opsiyonel):") || "";
    setBusyId(id);
    setErr("");
    const { error } = await supabase.rpc("admin_reject_withdrawal", { p_id: id, p_reason: reason });
    if (error) setErr(error.message);
    await load();
    setBusyId(null);
  }

  if (loading) return <div className="p-10 text-white">Loading...</div>;
  if (err) return <div className="p-10 text-red-400">{err}</div>;

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <h1 className="mb-6 text-3xl font-semibold">Admin Panel • Withdrawals</h1>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full">
          <thead className="bg-white/10 text-left text-sm">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">User</th>
              <th className="p-3">Coin</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Address</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((w) => (
              <tr key={w.id} className="border-t border-white/10">
                <td className="p-3 whitespace-nowrap">
                  {new Date(w.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-mono text-xs">{w.user_id}</td>
                <td className="p-3">{w.coin}</td>
                <td className="p-3">{w.amount}</td>
                <td className="p-3 font-mono text-xs">{w.address}</td>
                <td className="p-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    {w.status || "pending"}
                  </span>
                  {w.reject_reason ? (
                    <div className="mt-1 text-xs text-white/60">Reason: {w.reject_reason}</div>
                  ) : null}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-white px-3 py-2 text-black disabled:opacity-50"
                      disabled={busyId === w.id}
                      onClick={() => approve(w.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white disabled:opacity-50"
                      disabled={busyId === w.id}
                      onClick={() => reject(w.id)}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="p-4 text-white/70" colSpan={7}>
                  No withdrawals yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
