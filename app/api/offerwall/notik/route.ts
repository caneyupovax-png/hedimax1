import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id");

    if (!rawUserId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Panelden aldığın string ID'ler: gbFDtAU43N ve l1aPQJ
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    if (!appId || !pubId) {
      return NextResponse.json(
        { error: "Vercel Variables Eksik: NOTIK_APP_ID veya NOTIK_PUB_ID tanımlanmamış." },
        { status: 500 }
      );
    }

    // UUID temizleme
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();

    // ✅ Notik String ID'ler için en uyumlu URL formatı
    const url = `https://notik.me/coins/api/get-offers?app_id=${appId}&pub_id=${pubId}&user_id=${notikUserId}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}