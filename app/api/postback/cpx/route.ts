import { NextRequest, NextResponse } from "next/server";

/**
 * CPX callback örnek parametreler:
 * status, trans_id, user_id, sub_id, sub_id_2, amount_local, amount_usd, offer_id, hash, ip_click
 *
 * Şimdilik hash doğrulamayı kapalı başlatıyoruz.
 * Önce callback’in düzgün düştüğünü görelim, sonra hash’i ekleriz.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams;

  const payload = {
    status: q.get("status"),
    trans_id: q.get("trans_id"),
    user_id: q.get("user_id"),
    sub_id: q.get("sub_id"),
    sub_id_2: q.get("sub_id_2"),
    amount_local: q.get("amount_local"),
    amount_usd: q.get("amount_usd"),
    offer_id: q.get("offer_id"),
    hash: q.get("hash"),
    ip_click: q.get("ip_click"),
  };

  // minimum kontrol
  if (!payload.trans_id || !payload.sub_id) {
    return NextResponse.json({ ok: false, error: "Missing trans_id or sub_id", payload }, { status: 400 });
  }

  // TODO: buraya Supabase coin ekleme + idempotency gelecek
  // Şimdilik sadece "geldi" diye OK dönelim:
  return NextResponse.json({ ok: true, received: payload });
}
