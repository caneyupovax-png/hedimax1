import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

/**
 * IMPORTANT:
 * AdsWedMedia signature MD5 formatı onların panel/dokümanında yazar.
 * Ben burada en yaygın 3 varyasyonu destekleyecek şekilde kontrol ediyorum.
 * Doğru olanı bulunca diğerlerini silebilirsin.
 */
function verifySignature(params: URLSearchParams) {
  const secret = process.env.ADSWED_SECRET || "";
  if (!secret) return { ok: true, reason: "ADSWED_SECRET not set (skipped)" };

  const subId = params.get("subId") || "";
  const transId = params.get("transId") || "";
  const reward = params.get("reward") || "";
  const payout = params.get("payout") || "";
  const signature = (params.get("signature") || "").toLowerCase();

  // Varyasyonlar (dokümana göre bir tanesi doğru çıkacak)
  const c1 = md5(`${transId}${secret}`);
  const c2 = md5(`${subId}${transId}${reward}${secret}`);
  const c3 = md5(`${subId}${transId}${reward}${payout}${secret}`);

  const ok = signature === c1 || signature === c2 || signature === c3;
  return { ok, reason: ok ? "match" : `no match (got=${signature}, c1=${c1}, c2=${c2}, c3=${c3})` };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subId = searchParams.get("subId");      // kullanıcı id (senin gönderdiğin)
    const transId = searchParams.get("transId");  // transaction unique
    const rewardRaw = searchParams.get("reward"); // coin/virtual currency absolute
    const payoutRaw = searchParams.get("payout"); // $ absolute
    const statusRaw = searchParams.get("status"); // "1" add, "2" subtract

    if (!subId || !transId || !rewardRaw || !statusRaw) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

    const reward = Number(rewardRaw);
    const payout = payoutRaw ? Number(payoutRaw) : null;
    const status = Number(statusRaw);

    if (!Number.isFinite(reward) || reward < 0) {
      return NextResponse.json({ error: "invalid reward" }, { status: 400 });
    }
    if (status !== 1 && status !== 2) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    // signature doğrulama
    const sig = verifySignature(searchParams);
    if (!sig.ok) {
      // Provider bazen "200 OK" ister; ama güvenlik için 403 döndürüyoruz.
      // Eğer AdsWed 200 zorunlu diyorsa: 200 + "INVALID" döndürebiliriz.
      return NextResponse.json({ error: "bad signature", detail: sig.reason }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "missing supabase env" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // delta: status=1 ekle, status=2 çıkar
    const delta = status === 1 ? Math.round(reward) : -Math.round(reward);

    // 1) Idempotent kayıt: transId unique olacak şekilde bir tabloya yaz.
    // Eğer sende böyle bir tablo yoksa aşağıdaki SQL'i Supabase'de oluştur.
    // table: adswed_postbacks (trans_id unique)
    const raw = Object.fromEntries(searchParams.entries());

    const { error: insErr } = await admin
      .from("adswed_postbacks")
      .insert({
        trans_id: transId,
        user_id: subId,
        delta,
        reward,
        payout,
        status,
        raw,
      });

    // Duplicate trans_id gelirse (zaten işlendi) → OK dön
    if (insErr && !String(insErr.message || "").toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "db insert failed", detail: insErr.message }, { status: 500 });
    }
    if (insErr && String(insErr.message || "").toLowerCase().includes("duplicate")) {
      return new NextResponse("OK", { status: 200 });
    }

    // 2) Kullanıcının puanını güncelle (kendi şemana göre ayarla)
    // A) Eğer profiles tablon varsa:
    const { error: upErr } = await admin.rpc("increment_points", {
      p_user_id: subId,
      p_delta: delta,
      p_provider: "adswedmedia",
      p_ref: transId,
    });

    // Eğer increment_points RPC yoksa, aşağıdaki gibi direkt update yapman gerekir
    // (ama yarış durumları olabilir; RPC daha doğru).
    if (upErr) {
      return NextResponse.json({ error: "points update failed", detail: upErr.message }, { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "server error", detail: e?.message || String(e) }, { status: 500 });
  }
}
