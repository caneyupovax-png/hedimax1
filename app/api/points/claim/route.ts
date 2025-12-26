import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const userId = userData.user.id;

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount ?? 0);       // örn 50
  const ref = String(body.ref ?? "");            // örn "task_123_done"
  const reason = String(body.reason ?? "task_complete");

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  // TODO: burada gerçekten task tamamlandı mı kontrolünü koyacağız (bir sonraki adım).
  const { error: rpcErr } = await supabaseAdmin.rpc("apply_points", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_ref: ref,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
