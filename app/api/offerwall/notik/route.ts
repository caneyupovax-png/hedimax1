import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUserId = searchParams.get("user_id");

  if (!rawUserId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const apiKey = process.env.NOTIK_API_KEY;
  const appId = process.env.NOTIK_APP_ID;
  const pubId = process.env.NOTIK_PUB_ID;

  if (!apiKey || !appId || !pubId) {
    return NextResponse.json(
      { error: "Missing env" },
      { status: 500 }
    );
  }

  // ✅ NOTIK UYUMLU USER ID
  const notikUserId = "U" + rawUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);

  const url =
    `https://notik.me/coins` +
    `?api_key=${apiKey}` +
    `&pub_id=${pubId}` +
    `&app_id=${appId}` +
    `&user_id=${notikUserId}`;

  return NextResponse.json({ url });
}
