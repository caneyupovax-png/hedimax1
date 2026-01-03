import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const apiKey = process.env.NOTIK_API_KEY;
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    if (!apiKey || !appId || !pubId) {
      return NextResponse.json(
        {
          error:
            "Missing env: NOTIK_API_KEY / NOTIK_APP_ID / NOTIK_PUB_ID",
        },
        { status: 500 }
      );
    }

    // ✅ Notik offerwall URL format (coins)
    const url =
      `https://notik.me/coins` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&app_id=${encodeURIComponent(appId)}` +
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
