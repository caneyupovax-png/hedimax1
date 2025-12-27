import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.headers.get("cookie")
            ? req.headers
                .get("cookie")!
                .split(";")
                .map((c) => {
                  const [name, ...rest] = c.trim().split("=");
                  return { name, value: rest.join("=") };
                })
            : [];
        },
        setAll(cookies) {
          cookies.forEach((c) => res.cookies.set(c.name, c.value, c.options));
        },
      },
    }
  );

  // ✅ Server-side sign out -> cookie/refresh token temizliği
  await supabase.auth.signOut();

  return res;
}
