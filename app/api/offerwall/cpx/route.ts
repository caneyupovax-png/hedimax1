import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toNumber = (v: any) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
};

function getClientIp(req: NextRequest) {
  // Vercel/Proxy ortamı
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const rip = req.headers.get("x-real-ip");
  if (rip) return rip.trim();
  return "";
}

export async function GET(req: NextRequest) {
  const appId = process.env.CPX_APP_ID || "";
  const secureHashSecret = process.env.CPX_SECURE_HASH || ""; // CPX Publisher paneldeki "App Secure Hash"
  const payoutMultiplier = Number(process.env.CPX_PAYOUT_MULTIPLIER || "100"); // istersen 1 yap

  if (!appId) {
    return NextResponse.json({ ok: false, error: "Missing CPX_APP_ID" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || "";

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRe.test(userId)) {
    return NextResponse.json({ ok: false, error: "Invalid user_id" }, { status: 400 });
  }

  const ipUser = getClientIp(req);
  if (!ipUser) {
    // ip_user CPX API’de zorunlu
    return NextResponse.json(
      { ok: false, error: "Missing client IP (x-forwarded-for)" },
      { status: 400 }
    );
  }

  // secure_hash öneriliyor (aktifse şart). Dok: md5("{ext_user_id}-{app_secure_hash}")
  const secureHash = secureHashSecret
    ? crypto.createHash("md5").update(`${userId}-${secureHashSecret}`).digest("hex")
    : "";

  const apiUrl = new URL("https://live-api.cpx-research.com/api/get-surveys.php");
  apiUrl.searchParams.set("app_id", appId);
  apiUrl.searchParams.set("ext_user_id", userId);
  apiUrl.searchParams.set("output_method", "api");
  apiUrl.searchParams.set("ip_user", ipUser);
  apiUrl.searchParams.set("user_agent", req.headers.get("user-agent") || ""); // opsiyonel
  apiUrl.searchParams.set("limit", "30");
  if (secureHash) apiUrl.searchParams.set("secure_hash", secureHash);

  let res: Response;
  let text = "";

  try {
    res = await fetch(apiUrl.toString(), { cache: "no-store" });
    text = await res.text();
  } catch {
    return NextResponse.json({ ok: false, error: "CPX fetch failed (network)" }, { status: 500 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `CPX HTTP ${res.status}`, detail: text.slice(0, 200) },
      { status: 502 }
    );
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, error: "CPX returned non-JSON", detail: text.slice(0, 200) },
      { status: 502 }
    );
  }

  const surveys = Array.isArray(data?.surveys) ? data.surveys : [];

  const offers = surveys.map((s: any) => {
    // CPX örnek response: payout (USD gibi float) + href linki
    const payout = toNumber(s.payout);
    const reward = Math.round(payout * payoutMultiplier);

    return {
      id: s.id,
      title: s.type ? String(s.type) : "Survey",
      reward,                 // ✅ frontend bunu yazacak
      payout,                 // debug/istersen gösterirsin
      duration: toNumber(s.loi) || null,
      url: s.href,            // CPX linki (click.cpx-research.com)
      provider: "cpx" as const,
    };
  });

  return NextResponse.json({
    ok: true,
    count: offers.length,
    offers,
  });
}
