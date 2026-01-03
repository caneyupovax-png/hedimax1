import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = searchParams.get("subId");
    const transId = searchParams.get("transId");
    const rewardStr = searchParams.get("reward");
    const statusStr = searchParams.get("status") || "1";

    if (!subId || !transId || !rewardStr) {
      return new NextResponse("MISSING_PARAMS", { status: 400 });
    }

    const reward = Number(rewardStr);
    const status = Number(statusStr);

    if (status !== 1 || reward <= 0) {
      return new NextResponse("IGNORED", { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🔒 Duplicate check
    const { data: dup } = await supabase
      .from("offerwall_conversions")
      .select("id")
      .eq("provider", "notik")
      .eq("transaction_id", transId)
      .maybeSingle();

    if (dup) {
      return new NextResponse("DUP", { status: 200 });
    }

    // 🧾 Log conversion
    await supabase.from("offerwall_conversions").insert({
      provider: "notik",
      user_id: subId,
      transaction_id: transId,
      reward,
    });

    // 💰 SADECE UPDATE (insert yok!)
    const { data, error } = await supabase
      .from("points_balance")
      .select("balance")
      .eq("user_id", subId)
      .maybeSingle();

    if (error || !data) {
      return new NextResponse("USER_BALANCE_NOT_FOUND", { status: 400 });
    }

    const newBalance = Number(data.balance) + reward;

    const { error: updErr } = await supabase
      .from("points_balance")
      .update({ balance: newBalance })
      .eq("user_id", subId);

    if (updErr) {
      console.log("BALANCE_UPDATE_FAILED", updErr);
      return new NextResponse("BALANCE_ERROR", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e) {
    console.log("NOTIK_FATAL", e);
    return new NextResponse("SERVER_ERROR", { status: 500 });
  }
}
