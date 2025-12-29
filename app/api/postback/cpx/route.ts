import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CPX Postback params (senin ekrandan):
 * status=1
 * trans_id=...
 * user_id=...
 * amount_local=500.0000   // senin local coin
 * amount_usd=0.50         // CPX USD
 * type=complete|out|bonus
 * hash=...                // (bazı hesaplarda secure_hash diye de geçer)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ ŞART
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const status = sp.get("status"); // "1" or "2"
  const trans_id = sp.get("trans_id");
  const user_id = sp.get("user_id");
  const type = (sp.get("type") || "").toLowerCase(); // complete/out/bonus
  const amount_local_raw = sp.get("amount_local");
  const amount_usd_raw = sp.get("amount_usd");

  // CPX bazen secure_hash gönderir, bazen sen hash diye koyarsın:
  const hash = sp.get("secure_hash") || sp.get("hash") || "";

  // 1) basic validation
  if (!status || !trans_id || !user_id) {
    return NextResponse.json(
      { ok: false, error: "missing params", got: Object.fromEntries(sp.entries()) },
      { status: 400 }
    );
  }

  // 2) coin hesapla
  // amount_local = senin coin (en doğru)
  // yoksa amount_usd * 1000
  const amount_local = amount_local_raw ? Number(amount_local_raw) : NaN;
  const amount_usd = amount_usd_raw ? Number(amount_usd_raw) : NaN;

  let coins = 0;
  if (!Number.isNaN(amount_local) && amount_local > 0) {
    coins = Math.round(amount_local);
  } else if (!Number.isNaN(amount_usd) && amount_usd > 0) {
    coins = Math.round(amount_usd * 1000);
  }

  // complete/out/bonus değilse bile status=1 geldiyse 0 coin yazmak istemeyiz:
  if (status === "1" && coins <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "coins computed as 0 (check amount_local/amount_usd mapping)",
        amount_local_raw,
        amount_usd_raw,
        got: Object.fromEntries(sp.entries()),
      },
      { status: 422 }
    );
  }

  try {
    // 3) duplicate check (transactions tablosu öneriyorum)
    // Tablo yoksa aşağıda SQL veriyorum.
    const { data: existing, error: existErr } = await supabase
      .from("transactions")
      .select("id, status, coins")
      .eq("provider", "cpx")
      .eq("txid", trans_id)
      .maybeSingle();

    // tablo yoksa existErr dönebilir. O zaman direkt işlemi deneyeceğiz ama hata göstereceğiz.
    if (!existErr && existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // 4) status=2 reversal gelirse (istersen kapat)
    const signedCoins = status === "2" ? -Math.abs(coins) : coins;

    // 5) coin ekle (points_balance tablon varsa onu kullan)
    // A) points_balance update
    const { error: upErr } = await supabase.rpc("add_coins", {
      p_user_id: user_id,
      p_amount: signedCoins,
    });

    if (upErr) {
      // RPC yoksa fallback: points_balance tablosunu direkt update etmeye çalış
      // (Senin şeman farklıysa burayı kendi tablo/kolonlarına göre değiştir)
      const { data: pbRow, error: pbSelErr } = await supabase
        .from("points_balance")
        .select("user_id,balance")
        .eq("user_id", user_id)
        .maybeSingle();

      if (pbSelErr) {
        return NextResponse.json(
          { ok: false, error: "rpc failed and points_balance select failed", upErr, pbSelErr },
          { status: 500 }
        );
      }

      if (!pbRow) {
        const { error: insErr } = await supabase.from("points_balance").insert({
          user_id,
          balance: Math.max(0, signedCoins),
        });
        if (insErr) {
          return NextResponse.json(
            { ok: false, error: "rpc failed and points_balance insert failed", upErr, insErr },
            { status: 500 }
          );
        }
      } else {
        const newBal = Number(pbRow.balance || 0) + signedCoins;
        const { error: updErr2 } = await supabase
          .from("points_balance")
          .update({ balance: newBal })
          .eq("user_id", user_id);
        if (updErr2) {
          return NextResponse.json(
            { ok: false, error: "rpc failed and points_balance update failed", upErr, updErr2 },
            { status: 500 }
          );
        }
      }
    }

    // 6) transaction log (varsa)
    // transactions tablon yoksa burası hata verebilir; o durumda yine ok döndürüp loglamayı kapatabilirsin.
    await supabase.from("transactions").insert({
      provider: "cpx",
      txid: trans_id,
      user_id,
      coins: signedCoins,
      status: Number(status),
      type,
      hash,
      raw: Object.fromEntries(sp.entries()),
    });

    return NextResponse.json({
      ok: true,
      credited: signedCoins,
      user_id,
      trans_id,
      status,
      type,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
  }
}
