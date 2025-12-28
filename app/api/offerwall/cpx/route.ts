import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toNumber = (v: any) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
};

export async function GET(req: NextRequest) {
  const appId = process.env.CPX_APP_ID || "";
  if (!appId) {
    return NextResponse.json(
      { ok: false, error: "Missing CPX_APP_ID" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || "";

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRe.test(userId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid user_id" },
      { status: 400 }
    );
  }

  // 🔹 CPX survey API
  const apiUrl = new URL("https://offers.cpx-research.com/api/get-surveys.php");
  apiUrl.searchParams.set("app_id", appId);
  apiUrl.searchParams.set("ext_user_id", userId);

  let data: any;

  try {
    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    data = await res.json();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "CPX fetch failed" },
      { status: 500 }
    );
  }

  const surveys = Array.isArray(data?.surveys) ? data.surveys : [];

  // ✅ ÖDÜL NORMALIZATION (ASIL OLAY BURASI)
  const normalizedOffers = surveys.map((o: any) => {
    const reward =
      o.reward ??
      o.payout ??
      o.coins ??
      o.amount ??
      o.cpx_reward ??
      o.price ??
      0;

    return {
      id: o.id,
      title: o.title || o.name || "Survey",
      reward: toNumber(reward),
      duration: o.duration ?? o.loi ?? null,
      url: o.url,
      provider: "cpx",
    };
  });

  return NextResponse.json({
    ok: true,
    offers: normalizedOffers,
  });
}
