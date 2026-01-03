import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * NOTIK POSTBACK
 * Expected params:
 * - subId      => user id (Supabase UUID)
 * - transId    => transaction id (unique)
 * - reward     => coin amount
 * - status     => 1 = add, else ignore / cancel
 */

async function getAndUpdatePointsBalance(
  admin: any,
  userId: string,
  delta: number
) {
  const pb: any = admin.from("points_balance");

  // 1️⃣ Try: points_balance(user_id, balance)
  const { data: rowA, error: errA } = await pb
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (!errA && rowA) {
    await pb
      .update({ balance: Number(rowA.balance || 0) + delta })
      .eq("user_id", userId);
    return;
  }

  // 2️⃣ Try: points_balance(user_id, points)
  const { data: rowB, error: errB } = await pb
    .select("points")
    .eq("user_id", userId)
    .maybeSingle();

  if (!errB && rowB) {
    await pb
      .update({ points: Number(rowB.points || 0) + delta })
      .eq("user_id", userId);
    return;
  }

  // 3️⃣ Insert fallback
  await pb.insert({
    user_id: userId,
    balance: delta,
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = searchParams.get("subId");       // user id
    const transId = searchParams.get("transId");   // transaction id
    const rewardRaw = searchParams.get("reward");
    const statusRaw = searchParams.get("status");

    if (!subId || !transId || !rewardRaw) {
      console.log("NOTIK_MISSING_PARAMS", {
        subId,
        transId,
        rewardRaw,
      });
      return new NextResponse("MISSING_PARAMS", { status: 400 });
    }

    const reward = Number(rewardRaw);
    const status = Number(statusRaw || "1");

    if (!reward || reward <= 0) {
      return new NextResponse("IGNORED_ZERO_REWARD", { status: 200 });
    }

    // Only status=1 adds reward
    if (status !== 1) {
      return new NextResponse("IGNORED_STATUS", { status: 200 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🔒 Duplicate check
    const { data: existing } = await admin
      .from("offerwall_conversions")
      .select("id")
      .eq("provider", "notik")
      .eq("transaction_id", transId)
      .maybeSingle();

    if (existing) {
      return new NextResponse("DUP", { status: 200 });
    }

    // 🧾 Log conversion
    await admin.from("offerwall_conversions").insert({
      provider: "notik",
      user_id: subId,
      transaction_id: transId,
      reward,
      raw: Object.fromEntries(searchParams.entries()),
    });

    // 💰 Update balance
    try {
      await getAndUpdatePointsBalance(admin, subId, reward);
    } catch (e: any) {
      console.log("NOTIK_POINTS_BALANCE_FAILED", e);
      return new NextResponse("BALANCE_ERROR", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.log("NOTIK_SERVER_ERROR", e);
    return new NextResponse("SERVER_ERROR", { status: 500 });
  }
}
