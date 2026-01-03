import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Notik postback params
    const subId = searchParams.get("subId");      // UUID (dashsiz)
    const txnId = searchParams.get("transId");    // unique transaction id
    const amountRaw = searchParams.get("amount"); // reward amount

    if (!subId || !txnId || !amountRaw) {
      return new NextResponse("Missing params", { status: 400 });
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    /* ------------------------------------------------
       1) DUPLICATE TXN CHECK
    ------------------------------------------------ */
    const { data: exists } = await supabase
      .from("notik_conversions")
      .select("id")
      .eq("txn_id", txnId)
      .maybeSingle();

    if (exists) {
      // duplicate → OK dön, tekrar yazma
      return new NextResponse("OK (duplicate)", { status: 200 });
    }

    /* ------------------------------------------------
       2) USER MATCH
       subId = UUID'nin tireleri kaldırılmış hali
       DB'de user_id UUID (tireli)
    ------------------------------------------------ */
    const { data: userRow, error: userErr } = await supabase
      .from("points_balance")
      .select("user_id")
      .ilike("user_id::text", `%${subId}%`)
      .single();

    if (userErr || !userRow) {
      console.log("NOTIK_USER_NOT_FOUND", subId);
      return new NextResponse("User not found", { status: 404 });
    }

    const userId = userRow.user_id;

    /* ------------------------------------------------
       3) SAVE CONVERSION
    ------------------------------------------------ */
    const { error: insertErr } = await supabase
      .from("notik_conversions")
      .insert({
        user_id: userId,
        txn_id: txnId,
        amount,
      });

    if (insertErr) {
      console.error("NOTIK_CONVERSION_INSERT_FAILED", insertErr);
      return new NextResponse("Insert failed", { status: 500 });
    }

    /* ------------------------------------------------
       4) UPDATE BALANCE (RPC)
    ------------------------------------------------ */
    const { error: rpcErr } = await supabase.rpc("increment_points", {
      uid: userId,
      val: amount,
    });

    if (rpcErr) {
      console.error("NOTIK_INCREMENT_POINTS_FAILED", rpcErr);
      return new NextResponse("Balance update failed", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    console.error("NOTIK_POSTBACK_ERROR", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
