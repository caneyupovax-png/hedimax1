import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // her durumda 200 OK
  return new Response("OK", { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response("OK", { status: 200 });
}
