if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return NextResponse.json(
    { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
    { status: 500 }
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, ref, reason } = body;

    if (!amount || !ref) {
      return NextResponse.json(
        { error: "Missing amount or ref" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 EN KRİTİK
    );

    // 1) auth user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);

    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    const userId = userData.user.id;

    // 2) transaction insert
    const { error: txErr } = await supabase.from("points_tx").insert({
      user_id: userId,
      amount,
      reason: reason ?? "manual",
      ref,
    });

    if (txErr) {
      return NextResponse.json(
        { error: txErr.message },
        { status: 400 }
      );
    }

    // 3) balance update (increment)
    const { data: bal } = await supabase
      .from("points_balance")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!bal) {
      await supabase.from("points_balance").insert({
        user_id: userId,
        balance: amount,
      });
    } else {
      await supabase
        .from("points_balance")
        .update({ balance: bal.balance + amount })
        .eq("user_id", userId);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
