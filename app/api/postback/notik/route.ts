import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const subId = searchParams.get("subId"); // Notik user_id
  const txnId = searchParams.get("transId");
  const amount = Number(searchParams.get("amount") || 0);

  if (!subId || !txnId || !amount) {
    return new NextResponse("Missing params", { status: 400 });
  }

  // ✅ subId = UUID (tireleri yok)
  // Supabase'te UUID tireli, o yüzden LIKE ile buluyoruz
  const { data: userRow, error } = await supabase
    .from("users")
    .select("id")
    .like("id", `%${subId}%`)
    .single();

  if (error || !userRow) {
    console.log("NOTIK_USER_NOT_FOUND", subId);
    return new NextResponse("User not found", { status: 404 });
  }

  const userId = userRow.id;

  // ✅ duplicate txn koruması
  const { data: exists } = await supabase
    .from("notik_conversions")
    .select("id")
    .eq("txn_id", txnId)
    .single();

  if (exists) {
    return new NextResponse("OK (duplicate)", { status: 200 });
  }

  // ✅ conversion kaydet
  await supabase.from("notik_conversions").insert({
    user_id: userId,
    txn_id: txnId,
    amount,
  });

  // ✅ balance ekle
  await supabase.rpc("increment_points", {
    uid: userId,
    val: amount,
  });

  return new NextResponse("OK", { status: 200 });
}
