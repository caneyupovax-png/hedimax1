import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const CPX_APP_ID = process.env.CPX_APP_ID!; // 30627

    if (!supabaseUrl || !serviceKey || !CPX_APP_ID) {
      return NextResponse.json(
        { ok: false, error: "Missing env variables" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    // basic uuid check
    if (
      !userId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid user_id" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // kullanıcı gerçekten var mı (opsiyonel ama güvenli)
    const { data: exists, error } = await supabase
      .from("points_balance")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // balance yoksa bile CPX açılabilir, bloklamıyoruz
      console.warn("points_balance lookup error:", error);
    }

    // ✅ CPX Offerwall URL
    // CPX'in kendi yönlendirmesi, subid_1 = user uuid
    const url = new URL("https://offers.cpx-research.com/index.php");
    url.searchParams.set("app_id", CPX_APP_ID);
    url.searchParams.set("ext_user_id", userId);
    url.searchParams.set("subid_1", userId);

    return NextResponse.json({
      ok: true,
      url: url.toString(),
    });
  } catch (err) {
    console.error("CPX offerwall error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
