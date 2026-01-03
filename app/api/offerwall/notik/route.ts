import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Server env tercih edilir, yoksa NEXT_PUBLIC fallback (kolaylık için)
    const appId = process.env.NOTIK_APP_ID || process.env.NEXT_PUBLIC_NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID || process.env.NEXT_PUBLIC_NOTIK_PUB_ID;

    if (!appId || !pubId) {
      return NextResponse.json(
        {
          error:
            "Missing env: NOTIK_APP_ID / NOTIK_PUB_ID (or NEXT_PUBLIC_NOTIK_APP_ID / NEXT_PUBLIC_NOTIK_PUB_ID)",
        },
        { status: 500 }
      );
    }

    // Notik offerwall base (değişirse tek yerden override edebil)
    // Panel başka bir link veriyorsa buraya koy:
    // NOTIK_OFFERWALL_BASE=https://notik.me/coins
    const base = process.env.NOTIK_OFFERWALL_BASE || "https://notik.me/coins";

    // ✅ User-facing offerwall URL: api_key YOK (API key genelde sadece API çağrılarında)
    const url =
      `${base}` +
      `?app_id=${encodeURIComponent(appId)}` +
      `&pub_id=${encodeURIComponent(pubId)}` +
      `&user_id=${encodeURIComponent(userId)}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
