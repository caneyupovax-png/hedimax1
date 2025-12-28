import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  try {
    // Body parse (bazı postbackler body göndermez)
    let body: any = null;
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await req.json().catch(() => null);
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData().catch(() => null);
      if (form) body = Object.fromEntries(form.entries());
    } else {
      // querystring gibi kullanmak istersen:
      body = null;
    }

    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());

    // TODO: burada provider'a göre parse/verify yapacaksın
    // örnek: user_id, amount, txid vs
    const payload = { provider, query, body };

    return NextResponse.json({ ok: true, result: payload });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
