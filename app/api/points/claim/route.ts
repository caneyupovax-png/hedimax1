import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // ✅ ENV guard (service role yoksa asla devam etme)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !service) {
      return NextResponse.json(
        { error: "Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { amount, ref, reason } = body;

    if (!amount || !ref) {
      return NextResponse.json({ error: "Missing amount or ref" }, { status: 400 });
    }

    // ✅ Admin supabase (RLS bypass)
    const admin = createClient(url, service);

    // ✅ Kullanıcıyı token ile doğrula
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);

    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const userId = userData.user.id;

    // 1) tx insert
    const { error: txErr } = await admin.from("points_tx").insert({
      user_id: userId,
      amount,
      reason: reason ?? "manual",
      ref,
    });

    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 400 });
    }

    // 2) balance upsert (increment)
    const { data: balRow, error: balErr } = await admin
      .from("points_balance")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (balErr) {
      return NextResponse.json({ error: balErr.message }, { status: 400 });
    }

    if (!balRow) {
      const { error: insErr } = await admin.from("points_balance").insert({
        user_id: userId,
        balance: amount,
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    } else {
      const { error: updErr } = await admin
        .from("points_balance")
        .update({ balance: Number(balRow.balance ?? 0) + Number(amount) })
        .eq("user_id", userId);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
