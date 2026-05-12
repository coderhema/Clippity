import { NextResponse } from "next/server";
import { getClippityManifest } from "@/lib/clippity/capabilities";
import { orchestratePluginEvent } from "@/lib/clippity/orchestrator";
import { runClippitySkill } from "@/lib/clippity/skills";

export async function GET() {
  return NextResponse.json(getClippityManifest());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    skill?: string;
    input?: unknown;
    event?: unknown;
  };

  if (body.event) {
    return NextResponse.json({
      ok: true,
      result: await orchestratePluginEvent(body.event as Parameters<typeof orchestratePluginEvent>[0]),
    });
  }

  if (!body.skill) {
    return NextResponse.json({ error: "Missing skill name" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    result: await runClippitySkill(body.skill, body.input ?? {}),
  });
}
