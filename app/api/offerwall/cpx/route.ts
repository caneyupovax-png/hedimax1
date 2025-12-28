import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const appId = process.env.CPX_APP_ID || "";
  const secureHashSecret = (process.env.CPX_SECURE_HASH || "").trim();

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

  // secure_hash CPX panelde aktifse lazım, değilse boş geçebiliriz
  const secureHash = secureHashSecret
    ? crypto.createHash("md5").update(`${userId}-${secureHashSecret}`).digest("hex")
    : "";

  // ✅ CPX Offerwall entry URL (stabil)
  const url = new URL("https://offers.cpx-research.com/index.php");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("ext_user_id", userId);
  if (secureHash) url.searchParams.set("secure_hash", secureHash);

  return NextResponse.json({
    ok: true,
    provider: "cpx",
    offerwall_url: url.toString(),
  });
}
