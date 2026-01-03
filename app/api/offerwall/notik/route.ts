import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id");

    if (!rawUserId) {
      return NextResponse.json({ error: "Kullanıcı ID eksik" }, { status: 400 });
    }

    // Panel görselindeki (ccs.PNG) kesin değerler:
    const appId = "gbFDtAU43N";
    const pubId = "I1aPQJ";
    const apiKey = "3J4cEH5ZXUyVRoUXVempY9n6uFcwm7Fs";

    // UUID formatını Notik'in beklediği temiz formata getir
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();

    // Paneldeki 'IFrame Link' (ccc.PNG) görselindeki sırayla URL oluşturma:
    const url = `https://notik.me/coins?api_key=${apiKey}&pub_id=${pubId}&app_id=${appId}&user_id=${notikUserId}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}