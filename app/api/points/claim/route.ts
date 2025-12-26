import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // önemli (service role + node runtime)

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      return NextResponse.json(
        { error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Invalid session", details: userErr?.message ?? null },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    const body = await req.json().catch(() => ({} as any));
    const amount = Number(body.amount ?? 0);
    const ref = String(body.ref ?? "");
    const reason = String(body.reason ?? "task_complete");

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!ref) {
      return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    }

    const { error: rpcErr } = await supabaseAdmin.rpc("apply_points", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_ref: ref,
    });

    if (rpcErr) {
      return NextResponse.json(
        { error: "RPC failed", details: rpcErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    // Artık EMPTY olmayacak; gerçek hatayı JSON olarak döneceğiz.
    return NextResponse.json(
      { error: "Server crashed", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
