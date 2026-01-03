import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toUuidFromNoDash(subId: string): string | null {
  // subId already UUID with dashes
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(subId)) {
    return subId.toLowerCase();
  }

  // UUID without dashes (32 hex)
  if (!/^[0-9a-fA-F]{32}$/.test(subId)) return null;

  const s = subId.toLowerCase();
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subIdRaw = searchParams.get("subId");      // UUID dashsiz (veya dashli)
    const txnId = searchParams.get("transId");       // unique
    const amountRaw = searchParams.get("amount");    // integer bekliyoruz

    if (!subIdRaw || !txnId || !amountRaw) {
      return new NextResponse("Missing params", { status: 400 });
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    // ✅ subId -> gerçek UUID
    const userId = toUuidFromNoDash(subIdRaw);
    if (!userId) {
      console.log("NOTIK_BAD_SUBID_FORMAT", subIdRaw);
      return new NextResponse("Bad subId format", { status: 400 });
    }

    // ✅ duplicate txn check
    const { data: exists } = await supabase
      .from("notik_conversions")
      .select("id")
      .eq("txn_id", txnId)
      .maybeSingle();

    if (exists) {
      return new NextResponse("OK (duplicate)", { status: 200 });
    }

    // ✅ conversion kaydet
    const { error: insErr } = await supabase
      .from("notik_conversions")
      .insert({
        user_id: userId,
        txn_id: txnId,
        amount,
      });

    if (insErr) {
      console.error("NOTIK_CONVERSION_INSERT_FAILED", insErr);
      return new NextResponse("Insert failed", { status: 500 });
    }

    // ✅ balance update (increment_points zaten yoksa row insert ediyor)
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
