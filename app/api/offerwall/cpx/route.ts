import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const appId = process.env.CPX_APP_ID || "";
  if (!appId) {
    return NextResponse.json(
      { ok: false, error: "Missing CPX_APP_ID" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || "";

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRe.test(userId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid user_id" },
      { status: 400 }
    );
  }

  const url = new URL("https://offers.cpx-research.com/index.php");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("ext_user_id", userId);
  url.searchParams.set("subid_1", userId);

  return NextResponse.json({ ok: true, url: url.toString() });
}
