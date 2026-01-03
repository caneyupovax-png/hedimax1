import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id"); // Supabase'den gelen UUID

    // 1. Kullanıcı ID kontrolü
    if (!rawUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // 2. Ortam değişkenlerini al (Vercel Dashboard üzerinden tanımlanmalı)
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    if (!appId || !pubId) {
      return NextResponse.json(
        { error: "Vercel üzerinde NOTIK_APP_ID veya NOTIK_PUB_ID eksik!" },
        { status: 500 }
      );
    }

    // 3. Notik için user_id formatını temizle (UUID tirelerini kaldırır)
    // Örn: 550e8400-e29b-41d4-a716-446655440000 -> 550e8400e29b41d4a716446655440000
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();

    // 4. Doğru Iframe URL Yapılandırması
    // NOT: Iframe linkinde api_key kullanılmaz, güvenlik hatasına yol açar.
    const url = `https://notik.me/coins/api/get-offers/${appId}?pub_id=${pubId}&user_id=${notikUserId}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}