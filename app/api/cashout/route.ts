import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const ALLOWED = new Set(["BTC", "LTC", "DOGE"]);

export async function POST(req: Request) {
  try {
    // ✅ Bu client kullanıcı session cookie’sini okur
    const supabase = createRouteHandlerClient({ cookies });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const coin = String(body?.coin || "").toUpperCase();
    const address = String(body?.address || "").trim();
    const amountNum = Number(body?.amount);

    if (!ALLOWED.has(coin)) {
      return NextResponse.json({ error: "Invalid coin" }, { status: 400 });
    }
    if (!address || address.length < 8) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const { error } = await supabase.from("withdrawals").insert({
      user_id: userData.user.id,
      coin,
      address,
      amount: amountNum,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
