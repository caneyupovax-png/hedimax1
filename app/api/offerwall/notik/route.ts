import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id"); // supabase uuid bekliyoruz

    if (!rawUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const apiKey = process.env.NOTIK_API_KEY;
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    if (!apiKey || !appId || !pubId) {
      return NextResponse.json(
        { error: "Missing env: NOTIK_API_KEY / NOTIK_APP_ID / NOTIK_PUB_ID" },
        { status: 500 }
      );
    }

    // ✅ Notik uyumlu user_id: UUID -> dashsiz (32 hex)
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();

    // güvenlik (UUID değilse hata ver)
    if (!/^[0-9a-f]{32}$/.test(notikUserId)) {
      return NextResponse.json(
        { error: "Bad user_id format (expected UUID)" },
        { status: 400 }
      );
    }

    // ✅ Dokümandaki iframe src formatı ile birebir
    const url =
      `https://notik.me/coins` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&pub_id=${encodeURIComponent(pubId)}` +
      `&app_id=${encodeURIComponent(appId)}` +
      `&user_id=${encodeURIComponent(notikUserId)}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
