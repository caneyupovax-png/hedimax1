import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // CPX test aracı bazen düz metin "OK" bekler.
  // Parametreler yoksa bile 200 OK dön.
  return new Response("OK", { status: 200 });
}
