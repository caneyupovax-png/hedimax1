import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * CPX secure_hash doğrulaması için secret'i Vercel Env'e koy:
 * CPX_POSTBACK_SECRET=xxxx
 *
 * Not: Hash algoritması/formatı CPX dokümanına göre değişebilir.
 * Aşağıdaki varsayım: SHA256( status|trans_id|user_id|sub_id|sub_id_2|amount_local|amount_usd|offer_id|SECRET )
 * Eğer CPX farklı istiyorsa, sadece makeSignedString / algo kısmını değiştiriyoruz.
 */
function verifyCpxHash(params: Record<string, string>) {
  const secret = process.env.CPX_POSTBACK_SECRET;
  if (!secret) return { ok: false, reason: "Missing CPX_POSTBACK_SECRET env" };

  const status = params.status || "";
  const trans_id = params.trans_id || "";
  const user_id = params.user_id || "";
  const sub_id = params.sub_id || "";
  const sub_id_2 = params.sub_id_2 || "";
  const amount_local = params.amount_local || "";
  const amount_usd = params.amount_usd || "";
  const offer_id = params.offer_id || "";
  const provided = (params.hash || "").toLowerCase();

  // CPX’in verdiği şablondaki sırayla imzalı string (varsayım)
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  if (provider !== "cpx") {
    return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  }

  const url = new URL(req.url);
  const q = url.searchParams;

  const params = {
    status: q.get("status") || "",
    trans_id: q.get("trans_id") || "",
    user_id: q.get("user_id") || "",
    sub_id: q.get("sub_id") || "",
    sub_id_2: q.get("sub_id_2") || "",
    amount_local: q.get("amount_local") || "",
    amount_usd: q.get("amount_usd") || "",
    offer_id: q.get("offer_id") || "",
    hash: q.get("hash") || "",
    ip_click: q.get("ip_click") || "",
  };

  // Minimum doğrulamalar
  if (!params.trans_id || !params.sub_id) {
    return NextResponse.json(
      { ok: false, error: "Missing trans_id or sub_id" },
      { status: 400 }
    );
  }

  // Hash doğrula (CPX dokümanına göre gerekebilir)
  const hashCheck = verifyCpxHash(params);
  if (!hashCheck.ok) {
    // Prod’da güvenlik için fail et; debug için expected/provided dönüyorum.
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid hash",
        debug: {
          provided: hashCheck.provided,
          expected: hashCheck.expected,
          signedPreview: hashCheck.signedPreview,
          reason: hashCheck.reason,
        },
      },
      { status: 403 }
    );
  }

  // Status’e göre kredi ver (CPX’in status değerleri docs’ta yazar)
  // Genelde: approved/confirmed = credit, reversed/chargeback = geri al
  const status = params.status.toLowerCase();

  // Örnek: sadece approved/confirmed kredi ver
  const shouldCredit = ["approved", "confirmed", "1", "success"].includes(status);

  // amount_usd -> coin dönüşümü (örnek)
  const amountUsd = Number(params.amount_usd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid amount_usd" }, { status: 400 });
  }

  // TODO: Burada Supabase ile:
  // 1) offerwall_events tablosuna trans_id unique olacak şekilde insert (idempotent)
  // 2) shouldCredit true ise points_balance += hesaplananCoin
  // 3) shouldCredit false ise sadece logla (ya da reverse desteği ekle)
  //
  // Şimdilik OK dönelim:
  return NextResponse.json({
    ok: true,
    provider: "cpx",
    credited: shouldCredit,
    trans_id: params.trans_id,
    user_id: params.sub_id, // ÖNEMLİ: senin user bağlaman sub_id ile olacak (aşağıya bak)
  });
}
