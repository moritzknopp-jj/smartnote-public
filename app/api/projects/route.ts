// ============================================================
// SMARTNOTE — Projects API Route (persistence)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { saveProject, listProjects, deleteProject } from '@/lib/storage';
import { Project } from '@/lib/types';

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list projects';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const project = (await req.json()) as Project;
    if (!project.id || !project.name) {
      return NextResponse.json({ error: 'Project id and name are required' }, { status: 400 });
    }
    await saveProject(project);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save project';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete project';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
