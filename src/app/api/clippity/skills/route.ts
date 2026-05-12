import { NextResponse } from 'next/server';
import { getClippityManifest } from '@/lib/clippity/daemon';

export const dynamic = 'force-dynamic';

export async function GET() {
  const manifest = getClippityManifest();
  return NextResponse.json({
    skills: manifest.skills,
    pluginEnvironments: manifest.pluginEnvironments,
    architecture: manifest.architecture,
  });
}
