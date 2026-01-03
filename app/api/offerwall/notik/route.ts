import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function mask(s?: string) {
  if (!s) return "";
  if (s.length <= 8) return "********";
  return `${s.slice(0, 4)}********${s.slice(-4)}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const apiKey = process.env.NOTIK_API_KEY; // App API KEY (coins/click için)
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    const missing: string[] = [];
    if (!apiKey) missing.push("NOTIK_API_KEY");
    if (!appId) missing.push("NOTIK_APP_ID");
    if (!pubId) missing.push("NOTIK_PUB_ID");

    if (missing.length) {
      return NextResponse.json(
        {
          error: `Missing env: ${missing.join(" / ")}`,
          debug: {
            apiKey: mask(apiKey),
            appId: appId || "",
            pubId: pubId || "",
          },
        },
        { status: 500 }
      );
    }

    // ⚠️ Eğer Notik panelinde "Click URL" farklıysa buradan override edebilirsin
    // NOTIK_CLICK_BASE=https://notik.me/coins   (default)
    const base = process.env.NOTIK_CLICK_BASE || "https://notik.me/coins";

    // Notik farklı isimler bekleyebildiği için 4 varyasyon üretiyoruz
    const urls = [
      // 1) subId
      `${base}?api_key=${encodeURIComponent(apiKey!)}&pub_id=${encodeURIComponent(
        pubId!
      )}&app_id=${encodeURIComponent(appId!)}&subId=${encodeURIComponent(userId)}`,

      // 2) user_id
      `${base}?api_key=${encodeURIComponent(apiKey!)}&pub_id=${encodeURIComponent(
        pubId!
      )}&app_id=${encodeURIComponent(appId!)}&user_id=${encodeURIComponent(userId)}`,

      // 3) sub_id
      `${base}?api_key=${encodeURIComponent(apiKey!)}&pub_id=${encodeURIComponent(
        pubId!
      )}&app_id=${encodeURIComponent(appId!)}&sub_id=${encodeURIComponent(userId)}`,

      // 4) c1 (bazı networklerde sub param yerine c1 kullanılır)
      `${base}?api_key=${encodeURIComponent(apiKey!)}&pub_id=${encodeURIComponent(
        pubId!
      )}&app_id=${encodeURIComponent(appId!)}&c1=${encodeURIComponent(userId)}`,
    ];

    return NextResponse.json(
      {
        url: urls[0], // Earn bunu açacak
        urls, // sen test için diğerlerini de göreceksin
        debug: {
          base,
          apiKey: mask(apiKey),
          appId,
          pubId,
          userIdPreview: `${userId.slice(0, 6)}...`,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
