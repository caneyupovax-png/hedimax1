import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function mask(v?: string) {
  if (!v) return "";
  if (v.length <= 8) return "********";
  return `${v.slice(0, 4)}********${v.slice(-4)}`;
}

export async function GET(req: Request) {
  const vercelId =
    req.headers.get("x-vercel-id") ||
    req.headers.get("x-vercel-request-id") ||
    "";

  try {
    const { searchParams } = new URL(req.url);
    const rawUserId = searchParams.get("user_id"); // supabase uuid bekliyoruz
    const debug = searchParams.get("debug") === "1";

    if (!rawUserId) {
      console.log("NOTIK_OPEN_MISSING_USER_ID", { vercelId });
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const apiKey = process.env.NOTIK_API_KEY;
    const appId = process.env.NOTIK_APP_ID;
    const pubId = process.env.NOTIK_PUB_ID;

    const missing: string[] = [];
    if (!apiKey) missing.push("NOTIK_API_KEY");
    if (!appId) missing.push("NOTIK_APP_ID");
    if (!pubId) missing.push("NOTIK_PUB_ID");

    if (missing.length) {
      console.log("NOTIK_OPEN_MISSING_ENV", {
        vercelId,
        missing,
        apiKey: mask(apiKey),
        appId: appId || "",
        pubId: pubId || "",
      });

      return NextResponse.json(
        { error: `Missing env: ${missing.join(" / ")}` },
        { status: 500 }
      );
    }

    // ✅ Notik user_id: UUID -> dashsiz 32 hex
    const notikUserId = rawUserId.replace(/-/g, "").toLowerCase();
    const isUuidNoDash = /^[0-9a-f]{32}$/.test(notikUserId);

    if (!isUuidNoDash) {
      console.log("NOTIK_OPEN_BAD_USER_ID_FORMAT", {
        vercelId,
        rawUserId,
        notikUserIdPreview: notikUserId.slice(0, 10) + "...",
      });

      return NextResponse.json(
        { error: "Bad user_id format (expected UUID)" },
        { status: 400 }
      );
    }

    // ✅ Notik dokümanındaki iframe src formatı (BİREBİR)
    const url =
      `https://notik.me/coins` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&pub_id=${encodeURIComponent(pubId)}` +
      `&app_id=${encodeURIComponent(appId)}` +
      `&user_id=${encodeURIComponent(notikUserId)}`;

    console.log("NOTIK_OPEN_OK", {
      vercelId,
      rawUserIdPreview: rawUserId.slice(0, 8) + "...",
      notikUserIdPreview: notikUserId.slice(0, 12) + "...",
      apiKey: mask(apiKey),
      appId,
      pubId,
      urlPreview: url.slice(0, 80) + "...",
      host: req.headers.get("host") || "",
      referer: req.headers.get("referer") || "",
    });

    // Debug modda response'a da koy (sadece sen görmek için)
    if (debug) {
      return NextResponse.json(
        {
          url,
          debug: {
            vercelId,
            host: req.headers.get("host") || "",
            referer: req.headers.get("referer") || "",
            appId,
            pubId,
            apiKey: mask(apiKey),
            rawUserId,
            notikUserId,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    console.log("NOTIK_OPEN_ERROR", { vercelId, error: e?.message || e });
    return NextResponse.json(
      { error: e?.message || "Unknown error", vercelId },
      { status: 500 }
    );
  }
}
