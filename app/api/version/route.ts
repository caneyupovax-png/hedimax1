import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    time: new Date().toISOString(),
    vercel: process.env.VERCEL ? true : false,
    env: process.env.VERCEL_ENV || null,
    git: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      branch: process.env.VERCEL_GIT_COMMIT_REF || null,
      repo: process.env.VERCEL_GIT_REPO_SLUG || null,
    },
  });
}
