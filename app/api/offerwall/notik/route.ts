import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;
    const secret = process.env.NOTIK_SECRET;

    if (!appId || !pubId || !secret) {
      return NextResponse.json(
        { error: "Missing env: NOTIK_APP_ID / NOTIK_PUB_ID / NOTIK_SECRET" },
        { status: 500 }
      );
    }

    /**
     * ✅ NOTIK OFFFERWALL URL (DOĞRU)
     * api_key DEĞİL → secret kullanılır
     */
    const url =
      `https://notik.me/coins` +
      `?app_id=${encodeURIComponent(appId)}` +
      `&pub_id=${encodeURIComponent(pubId)}` +
      `&key=${encodeURIComponent(secret)}` +
      `&user_id=${encodeURIComponent(userId)}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
