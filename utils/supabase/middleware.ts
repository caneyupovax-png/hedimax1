// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // middleware'de cookie set => response'a yazılır
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Bu çağrı session’ı yeniler / cookie’leri düzeltir
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
