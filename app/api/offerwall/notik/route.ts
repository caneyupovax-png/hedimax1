import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id"); // Supabase UUID

    if (!rawUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    // Not: Iframe URL'si için api_key gerekli değildir, bu yüzden burada kontrol etmiyoruz.
    if (!appId || !pubId) {
      return NextResponse.json(
        { error: "Missing env: NOTIK_APP_ID / NOTIK_PUB_ID" },
        { status: 500 }
      );
    }

    // ✅ Notik user_id = UUID'nin tireleri kaldırılmış hali (32 hex)
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();

    // UUID format kontrolü
    if (!/^[0-9a-f]{32}$/.test(notikUserId)) {
      return NextResponse.json(
        { error: "Bad user_id format (expected UUID)" },
        { status: 400 }
      );
    }

    // ✅ DÜZELTİLMİŞ NOTIK IFRAME URL FORMATI
    // App ID, URL yolunda (path) olmalı, pub_id ve user_id ise query parametresi olmalı.
    const url = `https://notik.me/coins/api/get-offers/${appId}?pub_id=${pubId}&user_id=${notikUserId}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}