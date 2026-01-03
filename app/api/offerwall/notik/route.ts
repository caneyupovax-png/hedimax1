import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id");

    // 1. Kullanıcı ID Kontrolü
    if (!rawUserId) {
      return NextResponse.json({ error: "Kullanıcı ID bulunamadı" }, { status: 400 });
    }

    // 2. Paneldeki Değerleri Al
    // Vercel'de bu değerlerin tam olarak şunlar olduğundan emin ol:
    // NOTIK_APP_ID=gbFDtAU43N
    // NOTIK_PUB_ID=l1aPQJ
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    if (!appId || !pubId) {
      return NextResponse.json(
        { error: "Vercel üzerinde ID'ler eksik!" },
        { status: 500 }
      );
    }

    // 3. UUID Formatını Notik'e Uygun Hale Getir (Tireleri kaldır)
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();

    // 4. GÜNCEL URL FORMATI (Panelindeki ID tipine göre en uyumlu hali)
    // Notik bazen /get-offers/ID şeklinde bazen de parametre şeklinde kabul eder.
    // Senin ID'n rakam olmadığı için parametre şeklinde göndermek en güvenlisidir:
    const url = `https://notik.me/coins/api/get-offers?app_id=${appId}&pub_id=${pubId}&user_id=${notikUserId}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Sunucu hatası" },
      { status: 500 }
    );
  }
}