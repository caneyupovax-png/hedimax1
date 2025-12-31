import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const coin = String(body.coin ?? "").toLowerCase(); // ltc btc doge
    const address = String(body.address ?? "").trim();
    const amount = Number(body.amount);

    const ALLOWED = ["ltc", "btc", "doge"];
    if (!ALLOWED.includes(coin)) {
      return NextResponse.json({ error: "invalid coin" }, { status: 400 });
    }

    if (!address || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 🔒 TEK NOKTA: RPC
    const { error: rpcError } = await supabase.rpc(
      "request_withdrawal",
      {
        p_user_id: user.id,
        p_coin: coin,
        p_address: address,
        p_amount: amount,
      }
    );

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "internal error" },
      { status: 500 }
    );
  }
}
