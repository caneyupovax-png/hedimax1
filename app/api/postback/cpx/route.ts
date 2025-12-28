import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const appId = process.env.CPX_APP_ID || "";

  if (!supabaseUrl || !serviceKey || !appId) {
    return NextResponse.json({ ok: false, error: "Missing env" }, { status: 500 });
  }

  // ✅ user id'yi query ile al (earn sayfası buraya userId yollayacak)
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || "";

  // basic uuid check
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ ok: false, error: "Invalid user_id" }, { status: 400 });
  }

  // İstersen user gerçekten var mı kontrol edelim (opsiyonel)
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: exists, error } = await supabase
    .from("points_balance")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // user balance yoksa bile devam edebilir; ama sorun varsa kesmeyelim
  }

  // ✅ CPX offerwall URL (CPX'in verdiği base linkin buysa kullan)
  // Sende testte görünen örnek: https://offers.cpx-research.com/index.php?app_id=30627&ext_user_id=...
  const url = new URL("https://offers.cpx-research.com/index.php");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("ext_user_id", userId);
  url.searchParams.set("subid_1", userId);

  return NextResponse.json({ ok: true, url: url.toString() });
}
