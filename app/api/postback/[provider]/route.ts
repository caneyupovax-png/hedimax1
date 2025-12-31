import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * CPX secure_hash doğrulaması için secret'i Vercel Env'e koy:
 * CPX_POSTBACK_SECRET=xxxx
 *
 * Varsayım (senin önceki notuna göre):
 * SHA256( status|trans_id|user_id|sub_id|sub_id_2|amount_local|amount_usd|offer_id|SECRET )
 * Eğer CPX dokümanında farklı format varsa, sadece buildSignedString kısmını değiştir.
 */
function verifyCpxHash(params: Record<string, string>) {
  const secret = process.env.CPX_POSTBACK_SECRET;
  if (!secret) return { ok: false, reason: "Missing CPX_POSTBACK_SECRET env" };

  const status = params.status || "";
  const trans_id = params.trans_id || "";
  const user_id = params.user_id || ""; // bazı entegrasyonlarda gelir
  const sub_id = params.sub_id || "";
  const sub_id_2 = params.sub_id_2 || "";
  const amount_local = params.amount_local || "";
  const amount_usd = params.amount_usd || "";
  const offer_id = params.offer_id || "";

  const provided =
    (params.secure_hash || params.hash || params.signature || "").toLowerCase();

  // CPX formatı farklıysa burayı güncelle
  const signed = [
    status,
    trans_id,
    user_id,
    sub_id,
    sub_id_2,
    amount_local,
    amount_usd,
    offer_id,
    secret,
  ].join("|");

  const expected = crypto.createHash("sha256").update(signed).digest("hex").toLowerCase();

  return {
    ok: Boolean(provided) && provided === expected,
    expected,
    provided,
    signedPreview: signed.slice(0, 120) + (signed.length > 120 ? "..." : ""),
  };
}

/**
 * CPX handler (mevcut akışı bozmadan)
 */
async function handleCpx(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => (params[k] = v));

  // status genelde "1" (approved/credited) gibi olur. Senin CPX akışına göre düzenleyebilirsin.
  const status = params.status || "";
  const shouldCredit = status === "1" || status.toLowerCase() === "approved" || status.toLowerCase() === "success";

  // amount_local varsa onu, yoksa amount_usd'yi (örn. *100 vs) kullanmak isteyebilirsin.
  // Şimdilik amount_local'i integer coin gibi alıyoruz.
  const amountLocalNum = Math.floor(Number(params.amount_local || "0"));
  const amountUsdNum = Number(params.amount_usd || "0");

  // Hash doğrulaması (secure_hash geliyorsa önerilir)
  // Hash parametresi gelmiyorsa bu kontrol "ok:false" dönebilir, ama biz request'i tamamen reddetmeyelim:
  // (İstersen burada zorunlu hale getirebilirsin.)
  const hasAnyHash =
    Boolean(params.secure_hash) || Boolean(params.hash) || Boolean(params.signature);

  const hashCheck = hasAnyHash ? verifyCpxHash(params) : { ok: true, reason: "No hash provided" as const };

  if (!hashCheck.ok) {
    return NextResponse.json(
      {
        ok: false,
        provider: "cpx",
        error: "Invalid secure_hash",
        details: hashCheck,
      },
      { status: 403 }
    );
  }

  // TODO: Burada Supabase ile:
  // 1) offerwall_events tablosuna (provider="cpx", transaction_id=trans_id) UNIQUE olacak şekilde insert (idempotent)
  // 2) shouldCredit true ise points_balance += hesaplananCoin
  // 3) shouldCredit false ise sadece logla (ya da reverse desteği ekle)
  //
  // Şimdilik OK dönelim:
  return NextResponse.json({
    ok: true,
    provider: "cpx",
    credited: shouldCredit,
    trans_id: params.trans_id || null,
    user_id: params.sub_id || null, // ÖNEMLİ: sende user bağlaman genelde sub_id ileydi
    amount_local: amountLocalNum,
    amount_usd: amountUsdNum,
  });
}

/**
 * MMWall handler
 * MMWall örnek parametreler:
 * user_id, amount, payout, transaction_id, user_ip, subid, offerid, offername
 */
async function handleMmwall(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("user_id") || "";
  const amount = searchParams.get("amount") || "";
  const transactionId = searchParams.get("transaction_id") || "";

  const payout = searchParams.get("payout") || "";
  const userIp = searchParams.get("user_ip") || "";
  const subid = searchParams.get("subid") || "";
  const offerid = searchParams.get("offerid") || "";
  const offername = searchParams.get("offername") || "";

  if (!userId || !amount || !transactionId) {
    return NextResponse.json(
      { ok: false, provider: "mmwall", error: "Missing required params (user_id, amount, transaction_id)" },
      { status: 400 }
    );
  }

  const points = Math.floor(Number(amount));
  if (!Number.isFinite(points) || points <= 0) {
    return NextResponse.json(
      { ok: false, provider: "mmwall", error: "Invalid amount" },
      { status: 400 }
    );
  }

  // TODO: Burada Supabase ile:
  // 1) offerwall_events tablosuna (provider="mmwall", transaction_id) UNIQUE olacak şekilde insert (idempotent)
  // 2) insert duplicate ise -> 200 OK dön (puan verme)
  // 3) points_balance += points
  // 4) payout/user_ip/subid/offerid/offername logla

  return NextResponse.json({
    ok: true,
    provider: "mmwall",
    credited: true,
    transaction_id: transactionId,
    user_id: userId,
    points,
    meta: { payout, userIp, subid, offerid, offername },
  });
}

/**
 * Router
 * /api/postback/cpx
 * /api/postback/mmwall
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  switch ((provider || "").toLowerCase()) {
    case "cpx":
      return handleCpx(req);

    case "mmwall":
      return handleMmwall(req);

    default:
      return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  }
}
