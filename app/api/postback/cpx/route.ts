import { NextRequest, NextResponse } from "next/server";

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

  // ✅ Parametre yoksa bile 200 dön (CPX testleri için)
  if (!payload.trans_id || !payload.sub_id) {
    return NextResponse.json({ ok: true, note: "Postback reachable (missing params)", payload });
  }

  // TODO: burada idempotency + coin ekleme yapacağız
  return NextResponse.json({ ok: true, received: payload });
}
