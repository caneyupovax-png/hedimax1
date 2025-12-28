import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );
}

export async function POST(
  req: Request,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider || "test";

    // JSON body (bozuk gelirse boş obje)
    const body: any = await req.json().catch(() => ({}));

    const user_id = body.user_id;
    const tx_id = body.tx_id;
    const amount = Number(body.amount ?? 0);

    // VALIDATION
    if (!tx_id) {
      return NextResponse.json(
        { ok: false, error: "tx_id required" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { ok: false, error: "user_id required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "amount must be > 0" },
        { status: 400 }
      );
    }

    // SUPABASE (SERVICE ROLE)
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("apply_offerwall_event", {
      p_provider: provider,
      p_tx_id: tx_id,
      p_user_id: user_id,
      p_amount: amount,
      p_raw: body,
      p_signature_ok: true, // şimdilik test
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "unknown error" },
      { status: 500 }
    );
  }
}
